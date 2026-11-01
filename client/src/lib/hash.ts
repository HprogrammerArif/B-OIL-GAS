/**
 * Content hashing for the prototype's e-signature trail.
 *
 * Signature codes are real SHA-256 digests over the signed content
 * (file number, paragraph, signer, remark, timestamp), so the same note
 * always verifies to the same code and any edit changes it.
 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Short, display-friendly signature code: `SIG-` + first 16 hex chars of the digest. */
export async function signatureCode(parts: readonly string[]): Promise<string> {
  const hex = await sha256Hex(parts.join('|'));
  return `SIG-${hex.slice(0, 16).toUpperCase()}`;
}
