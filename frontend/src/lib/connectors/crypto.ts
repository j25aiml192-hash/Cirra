import crypto from 'crypto';

export function decryptCredentials(encrypted: {
  iv: string;
  tag: string;
  ciphertext: string;
}): Record<string, string> {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is missing');
  }

  const key = Buffer.from(encryptionKey, 'base64');
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return JSON.parse(plain.toString('utf8'));
}

