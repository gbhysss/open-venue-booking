/**
 * Tiny, framework-independent request protections for mutation endpoints.
 * Browsers normally send Origin on fetch POST/PATCH requests. Reject a missing
 * Origin on privileged mutations rather than trusting attacker-controlled Host.
 */
export function isTrustedWriteOrigin(request: Request, configuredOrigin: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const allowed = new URL(configuredOrigin).origin;
    const supplied = new URL(origin);
    return supplied.origin === allowed && origin === supplied.origin;
  } catch { return false; }
}

export type LimitedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

/** Parse a JSON request body without buffering arbitrarily large input. */
export async function readLimitedJson(request: Request, maxBytes = 8192): Promise<LimitedJsonResult> {
  const mime = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|\s*$)/i.test(mime)) {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' };
  }
  const length = request.headers.get('content-length');
  if (length !== null && Number(length) > maxBytes) {
    return { ok: false, status: 413, error: 'Request body too large' };
  }
  if (!request.body) return { ok: false, status: 400, error: 'Empty request body' };
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: 'Request body too large' };
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let position = 0;
    for (const chunk of chunks) { body.set(chunk, position); position += chunk.byteLength; }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(body);
    return { ok: true, data: JSON.parse(decoded) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  } finally { reader.releaseLock(); }
}
