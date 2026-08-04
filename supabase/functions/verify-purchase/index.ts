import { corsHeaders, errorJson, json, readJson } from '../_shared/http.ts';
import { authenticatedUser } from '../_shared/supabase.ts';
import { verifyApplePurchase, verifyGooglePurchase } from '../_shared/store-verification.ts';

const allowedProducts = new Set([
  'com.linguaturtle.shells.150',
  'com.linguaturtle.shells.450',
  'com.linguaturtle.shells.1000',
]);

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const input = await readJson(request);
    const { user, adminClient } = await authenticatedUser(request);
    if (!allowedProducts.has(input.productId)) return json({ error: 'unknown_store_product' }, 422);

    let transactionId = '';
    let storePayload: Record<string, unknown> = {};
    let finishRequired = true;

    if (input.platform === 'ios') {
      if (typeof input.transactionId !== 'string') return json({ error: 'invalid_apple_transaction' }, 422);
      const verified = await verifyApplePurchase({
        transactionId: input.transactionId,
        productId: input.productId,
      });
      if (
        verified.transaction.appAccountToken
        && String(verified.transaction.appAccountToken) !== user.id
      ) throw new Error('transaction_owner_mismatch');
      transactionId = input.transactionId;
      storePayload = {
        environment: verified.environment,
        purchaseDate: verified.transaction.purchaseDate,
        originalTransactionId: verified.transaction.originalTransactionId,
      };
    } else if (input.platform === 'android') {
      if (typeof input.purchaseToken !== 'string') return json({ error: 'invalid_google_purchase' }, 422);
      const verified = await verifyGooglePurchase({
        productId: input.productId,
        purchaseToken: input.purchaseToken,
      });
      if (
        verified.purchase.obfuscatedExternalAccountId
        && String(verified.purchase.obfuscatedExternalAccountId) !== user.id
      ) throw new Error('transaction_owner_mismatch');
      transactionId = input.purchaseToken;
      storePayload = {
        orderId: verified.purchase.orderId || null,
        purchaseTimeMillis: verified.purchase.purchaseTimeMillis || null,
        regionCode: verified.purchase.regionCode || null,
      };
      const { data, error } = await adminClient.rpc('credit_verified_purchase', {
        p_user_id: user.id,
        p_platform: 'android',
        p_transaction_id: transactionId,
        p_product_id: input.productId,
        p_store_payload: storePayload,
      });
      if (error) throw error;
      try {
        await verified.consume();
        finishRequired = false;
      } catch {
        // The native client retries consumption. The ledger remains idempotent.
        finishRequired = true;
      }
      return json({ ...data, verified: true, finishRequired });
    } else {
      return json({ error: 'invalid_platform' }, 422);
    }

    const { data, error } = await adminClient.rpc('credit_verified_purchase', {
      p_user_id: user.id,
      p_platform: 'ios',
      p_transaction_id: transactionId,
      p_product_id: input.productId,
      p_store_payload: storePayload,
    });
    if (error) throw error;
    return json({ ...data, verified: true, finishRequired });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorJson(error, message.includes('authentication_required') ? 401 : 400);
  }
});
