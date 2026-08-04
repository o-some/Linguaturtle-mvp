const encoder = new TextEncoder();

const base64Url = (value: Uint8Array | string) => {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const decodeJwtPayload = (jwt: string) => {
  const payload = jwt.split('.')[1];
  if (!payload) throw new Error('invalid_signed_transaction');
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
};

const pemBytes = (pem: string) => {
  const clean = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(clean);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

async function signedJwt(
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
  privateKey: string,
  algorithm: RsaHashedImportParams | EcKeyImportParams,
) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedClaims = base64Url(JSON.stringify(claims));
  const unsigned = `${encodedHeader}.${encodedClaims}`;
  const importAlgorithm = algorithm.name === 'ECDSA'
    ? algorithm
    : { ...algorithm, hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(privateKey), importAlgorithm, false, ['sign']);
  const signAlgorithm = algorithm.name === 'ECDSA'
    ? { name: 'ECDSA', hash: 'SHA-256' }
    : { name: 'RSASSA-PKCS1-v1_5' };
  const signature = await crypto.subtle.sign(signAlgorithm, key, encoder.encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function appleAuthorization() {
  const issuerId = Deno.env.get('APPLE_ISSUER_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY');
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID') || 'com.linguaturtle.app';
  if (!issuerId || !keyId || !privateKey) throw new Error('apple_server_config_missing');
  const now = Math.floor(Date.now() / 1000);
  return signedJwt(
    { alg: 'ES256', kid: keyId, typ: 'JWT' },
    { iss: issuerId, iat: now, exp: now + 300, aud: 'appstoreconnect-v1', bid: bundleId },
    privateKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
  );
}

export async function verifyApplePurchase(input: {
  transactionId: string;
  productId: string;
  allowRevoked?: boolean;
}) {
  const authorization = await appleAuthorization();
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID') || 'com.linguaturtle.app';
  const paths = [
    'https://api.storekit.itunes.apple.com',
    'https://api.storekit-sandbox.itunes.apple.com',
  ];
  let lastError = 'apple_transaction_not_found';

  for (const base of paths) {
    const response = await fetch(
      `${base}/inApps/v1/transactions/${encodeURIComponent(input.transactionId)}`,
      { headers: { Authorization: `Bearer ${authorization}` } },
    );
    if (!response.ok) {
      lastError = `apple_verification_${response.status}`;
      continue;
    }
    const body = await response.json();
    const transaction = decodeJwtPayload(body.signedTransactionInfo);
    if (String(transaction.transactionId) !== String(input.transactionId)) throw new Error('apple_transaction_mismatch');
    if (transaction.productId !== input.productId) throw new Error('apple_product_mismatch');
    if (transaction.bundleId !== bundleId) throw new Error('apple_bundle_mismatch');
    if (transaction.revocationDate && !input.allowRevoked) throw new Error('apple_transaction_revoked');
    return { transaction, environment: body.environment || (base.includes('sandbox') ? 'Sandbox' : 'Production') };
  }
  throw new Error(lastError);
}

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

async function googleAccessToken() {
  const raw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  if (!raw) throw new Error('google_server_config_missing');
  const account = JSON.parse(raw) as GoogleServiceAccount;
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signedJwt(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: account.token_uri || 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    account.private_key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  );
  const response = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`google_oauth_${response.status}`);
  const body = await response.json();
  return body.access_token as string;
}

export async function verifyGooglePurchase(input: {
  productId: string;
  purchaseToken: string;
}) {
  const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'com.linguaturtle.app';
  const accessToken = await googleAccessToken();
  const root = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}`;
  const purchasePath = `/purchases/products/${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const response = await fetch(`${root}${purchasePath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`google_verification_${response.status}`);
  const purchase = await response.json();
  if (Number(purchase.purchaseState) !== 0) throw new Error('google_purchase_not_completed');
  return {
    purchase,
    consume: async () => {
      const consumeResponse = await fetch(`${root}${purchasePath}:consume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!consumeResponse.ok && consumeResponse.status !== 409) {
        throw new Error(`google_consume_${consumeResponse.status}`);
      }
    },
  };
}
