/**
 * Server-side encryption and client-side decryption utilities for admin permissions.
 * Uses AES-256-GCM encryption with Web Crypto API (Edge Runtime compatible).
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 12 bytes is recommended for GCM
const SALT_LENGTH = 16;
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

/**
 * Derives a CryptoKey from the secret string using PBKDF2.
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Create a proper ArrayBuffer from Uint8Array
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert Uint8Array to base64url string (cookie-safe, no +, /, or = chars)
 */
function toBase64url(buffer: Uint8Array): string {
  const bytes = Array.from(buffer);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convert base64url string back to Uint8Array
 */
function fromBase64url(base64url: string): Uint8Array {
  // Restore standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Restore padding
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Server-side function to encrypt permissions data.
 * @param data - The permissions object to encrypt
 * @param secret - Secret key from environment variable
 * @returns Base64-encoded encrypted string with IV and salt
 */
export async function encryptPermissions(
  data: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Generate random IV and salt
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Derive key
  const key = await deriveKey(secret, salt);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    plaintext
  );

  // Combine salt + IV + encrypted data
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedArray.length);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(encryptedArray, SALT_LENGTH + IV_LENGTH);

  return toBase64url(combined);
}

/**
 * Client-side function to decrypt permissions data.
 * @param encryptedData - Base64-encoded encrypted string from server
 * @param secret - Secret key from environment variable (exposed via NEXT_PUBLIC_)
 * @returns Decrypted permissions object
 */
export async function decryptPermissions<T = Record<string, unknown>>(
  encryptedData: string,
  secret: string,
): Promise<T> {
  try {
    const combined = fromBase64url(encryptedData);

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive key
    const key = await deriveKey(secret, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);

    return JSON.parse(plaintext) as T;
  } catch (error) {
    console.error('Failed to decrypt permissions:', error);
    throw new Error('Invalid permissions data');
  }
}

/**
 * Validates if the encrypted data can be decrypted (useful for testing)
 */
export async function validateEncryptedData(
  encryptedData: string,
  secret: string,
): Promise<boolean> {
  try {
    await decryptPermissions(encryptedData, secret);
    return true;
  } catch {
    return false;
  }
}
