// Utility for ECDH and AES-GCM End-to-End Encryption in the Browser

/**
 * Generates an ECDH Key Pair using the P-256 curve
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Exports a public key to string format via JWK
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
}

/**
 * Imports a public key from JWK string format
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/**
 * Derives a symmetric AES-GCM key from a local private key and a remote public key
 */
export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts cleartext using AES-GCM
 * Returns a Base64 encoded string containing the IV and Ciphertext
 */
export async function encryptMessage(
  text: string,
  sharedKey: CryptoKey
): Promise<string> {
  // Generate random 96-bit Initialization Vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  // Combine IV and Ciphertext for transport
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), iv.length);

  // Convert to Base64 (browser specific)
  // btoa handles strings where chars are 0-255, fine for Uint8Array mapping
  let binaryStr = '';
  payload.forEach(byte => binaryStr += String.fromCharCode(byte));
  return btoa(binaryStr);
}

/**
 * Decrypts a Base64 encoded IV + ciphertext using AES-GCM
 */
export async function decryptMessage(
  encryptedBase64: string,
  sharedKey: CryptoKey
): Promise<string> {
  const binaryStr = atob(encryptedBase64);
  const payload = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    payload[i] = binaryStr.charCodeAt(i);
  }

  // Extract the original IV
  const iv = payload.slice(0, 12);
  const ciphertext = payload.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
