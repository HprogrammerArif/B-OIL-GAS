import { ms } from "../clock";
import { digestsEqual, randomDigits, sha256 } from "../crypto";
import type { MockDb } from "../db/schema";
import { HttpError } from "../http";

const OTP_TTL = 5 * ms.MINUTE;
const MAX_ATTEMPTS = 5;

/** Issues a signing OTP; only its hash is stored (security rule: OTPs hashed, constant-time compare). */
export async function issueOtp(db: MockDb, userId: string, purpose: string): Promise<{ code: string; expiresAt: string }> {
  const code = randomDigits(6);
  const expiresAt = Date.now() + OTP_TTL;
  db.otps = db.otps.filter((o) => !(o.userId === userId && o.purpose === purpose) && o.expiresAt > Date.now());
  db.otps.push({ userId, purpose, codeHash: await sha256(`${purpose}:${code}`), expiresAt, attempts: 0 });
  return { code, expiresAt: new Date(expiresAt).toISOString() };
}

/** Consumes the OTP on success; failures are generic and capped. */
export async function verifyOtp(db: MockDb, userId: string, purpose: string, code: string | undefined): Promise<void> {
  const fail = (reason: string) => new HttpError("VALIDATION_ERROR", "The verification code is invalid or expired", [
    { path: ["signature", "otpCode"], reason, message: "Invalid code" },
  ]);
  const entry = db.otps.find((o) => o.userId === userId && o.purpose === purpose);
  if (!code || !entry || entry.expiresAt < Date.now()) throw fail("OTP_INVALID");
  if (entry.attempts >= MAX_ATTEMPTS) throw fail("OTP_LOCKED");
  entry.attempts += 1;
  const digest = await sha256(`${purpose}:${code}`);
  if (!digestsEqual(digest, entry.codeHash)) throw fail("OTP_INVALID");
  db.otps = db.otps.filter((o) => o !== entry);
}
