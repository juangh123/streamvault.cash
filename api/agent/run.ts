import { requestIp, runAgent } from '../../src/lib/agent-server.js';

function bodyOf(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, code: 'INVALID_REQUEST', message: 'Use POST.' });
    return;
  }
  try {
    const body = bodyOf(req);
    const result = await runAgent(body.payerPubkey, body.requestId, requestIp(req));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: (e as Error).message,
    });
  }
}
