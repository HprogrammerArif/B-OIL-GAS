import * as Crypto from "expo-crypto";

export const sha256 = (value: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);

/** Constant-time comparison of two equal-length hex digests. */
export function digestsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Uniform six-digit code from a CSPRNG (rejection sampling avoids modulo bias). */
export function randomDigits(length = 6): string {
  let out = "";
  while (out.length < length) {
    for (const byte of Crypto.getRandomBytes(16)) {
      if (byte < 250 && out.length < length) out += String(byte % 10);
    }
  }
  return out;
}

export const newId = (prefix: string) => `${prefix}_${Crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
