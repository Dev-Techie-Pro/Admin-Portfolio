import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function isEncryptedSecretValue(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptRuntimeSecret(plaintext: string, encryptionKey: string): string {
  if (!plaintext) return '';
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

export function decryptRuntimeSecret(stored: string, encryptionKey: string): string {
  if (!stored) return '';
  if (!isEncryptedSecretValue(stored)) return stored;
  const key = deriveKey(encryptionKey);
  const body = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split('.');
  if (!ivB64 || !tagB64 || !dataB64) return '';
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

export function runtimeSecretsEncryptionKey(): string | null {
  const key = process.env.SECRETS_ENCRYPTION_KEY?.trim();
  return key || null;
}
