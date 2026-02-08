/**
 * Server-side encryption and client-side decryption utilities for admin permissions.
 * Uses AES-256-GCM encryption to securely pass permissions from server to client.
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derives a 32-byte encryption key from the secret string.
 * Uses a consistent salt for deterministic key generation.
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Server-side function to encrypt permissions data.
 * @param data - The permissions object to encrypt
 * @param secret - Secret key from environment variable
 * @returns Base64-encoded encrypted string with IV, salt, and auth tag
 */
export function encryptPermissions(
  data: Record<string, unknown>,
  secret: string,
): string {
  if (typeof window !== 'undefined') {
    throw new Error('encryptPermissions can only be called on the server');
  }

  const plaintext = JSON.stringify(data);
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine salt + IV + authTag + encrypted data
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Client-side function to decrypt permissions data.
 * @param encryptedData - Base64-encoded encrypted string from server
 * @param secret - Secret key from environment variable (exposed via NEXT_PUBLIC_)
 * @returns Decrypted permissions object
 */
export function decryptPermissions<T = Record<string, unknown>>(
  encryptedData: string,
  secret: string,
): T {
  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey(secret, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch (error) {
    console.error('Failed to decrypt permissions:', error);
    throw new Error('Invalid permissions data');
  }
}

/**
 * Validates if the encrypted data can be decrypted (useful for testing)
 */
export function validateEncryptedData(
  encryptedData: string,
  secret: string,
): boolean {
  try {
    decryptPermissions(encryptedData, secret);
    return true;
  } catch {
    return false;
  }
}
