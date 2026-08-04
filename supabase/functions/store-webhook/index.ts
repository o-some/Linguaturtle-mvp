import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { errorJson, json, readJson } from '../_shared/http.ts';
import {
  decodeJwtPayload,
  verifyApplePurchase,
  verifyGooglePurchase,
} from '../_shared/store-verification.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('supabase_server_config_missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function handleApple(body: Record<string, unknown>) {
  if (typeof body.signedPayload !== 'string') throw new Error('invalid_apple_notification');
  const notification = decodeJwtPayload(body.signedPayload);
  const signedTransaction = notification.data?.signedTransactionInfo;
  if (typeof signedTransaction !== 'string') return { accepted: true, action: 'ignored_without_transaction' };
  const transaction = decodeJwtPayload(signedTransaction);
  const transactionId = String(transaction.transactionId || '');
  const productId = String(transaction.productId || '');
  if (!transactionId || !productId) throw new Error('invalid_apple_notification_transaction');

  const verified = await verifyApplePurchase({ transactionId, productId, allowRevoked: true });

  if (!verified.transaction.revocationDate) {
    const userId = String(verified.transaction.appAccountToken || '');
    if (!uuidPattern.test(userId)) {
      return { accepted: true, action: 'awaiting_in_app_sync' };
    }
    const { data, error } = await adminClient().rpc('credit_verified_purchase', {
      p_user_id: userId,
      p_platform: 'ios',
      p_transaction_id: transactionId,
      p_product_id: productId,
      p_store_payload: {
        environment: verified.environment,
        purchaseDate: verified.transaction.purchaseDate,
        notificationUUID: notification.notificationUUID,
      },
    });
    if (error) throw error;
    return { ...data, accepted: true, action: 'purchase_processed' };
  }
  const { data, error } = await adminClient().rpc('reverse_verified_purchase', {
    p_platform: 'ios',
    p_transaction_id: transactionId,
    p_reason: notification.notificationType === 'REVOKE' ? 'revoked' : 'refunded',
    p_store_payload: {
      notificationType: notification.notificationType,
      notificationUUID: notification.notificationUUID,
      receivedAt: new Date().toISOString(),
    },
  });
  if (error) throw error;
  return data;
}

async function handleGoogle(request: Request, body: Record<string, unknown>) {
  const expected = Deno.env.get('GOOGLE_RTDN_SHARED_SECRET');
  if (!expected || request.headers.get('x-linguaturtle-webhook-secret') !== expected) {
    throw new Error('invalid_google_webhook_secret');
  }
  const message = body.message && typeof body.message === 'object'
    ? body.message as Record<string, unknown>
    : null;
  const encoded = message?.data;
  if (typeof encoded !== 'string') throw new Error('invalid_google_notification');
  const decoded = JSON.parse(atob(encoded));
  const notification = decoded.oneTimeProductNotification;
  const voided = decoded.voidedPurchaseNotification;

  if (voided) {
    if (Number(voided.productType) !== 2 || typeof voided.purchaseToken !== 'string') {
      return { accepted: true, action: 'ignored_non_consumable_void' };
    }
    const { data, error } = await adminClient().rpc('reverse_verified_purchase', {
      p_platform: 'android',
      p_transaction_id: voided.purchaseToken,
      p_reason: 'refunded',
      p_store_payload: {
        orderId: voided.orderId,
        refundType: voided.refundType,
        eventTimeMillis: decoded.eventTimeMillis,
        receivedAt: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return data;
  }

  if (!notification) return { accepted: true, action: 'ignored_non_product_notification' };
  if (Number(notification.notificationType) === 2) {
    return { accepted: true, action: 'pending_purchase_cancelled' };
  }
  if (
    Number(notification.notificationType) !== 1
    || typeof notification.purchaseToken !== 'string'
    || typeof notification.sku !== 'string'
  ) return { accepted: true, action: 'ignored_product_notification' };

  const verified = await verifyGooglePurchase({
    productId: notification.sku,
    purchaseToken: notification.purchaseToken,
  });
  const userId = String(verified.purchase.obfuscatedExternalAccountId || '');
  if (!uuidPattern.test(userId)) {
    return { accepted: true, action: 'awaiting_in_app_sync' };
  }
  const { data, error } = await adminClient().rpc('credit_verified_purchase', {
    p_user_id: userId,
    p_platform: 'android',
    p_transaction_id: notification.purchaseToken,
    p_product_id: notification.sku,
    p_store_payload: {
      orderId: verified.purchase.orderId || null,
      purchaseTimeMillis: verified.purchase.purchaseTimeMillis || null,
      eventTimeMillis: decoded.eventTimeMillis,
    },
  });
  if (error) throw error;
  await verified.consume();
  return { ...data, accepted: true, action: 'purchase_processed' };
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await readJson(request);
    const result = typeof body.signedPayload === 'string'
      ? await handleApple(body)
      : await handleGoogle(request, body);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('secret') ? 401 : 400;
    return errorJson(error, status);
  }
});
