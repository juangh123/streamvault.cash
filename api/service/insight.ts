import { getServiceInsight } from '../../src/lib/agent-server.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, code: 'INVALID_REQUEST', message: 'Use GET.' });
    return;
  }
  try {
    const rawRequestId = req.query?.requestId;
    const rawTxid = req.query?.txid;
    const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;
    const txid = Array.isArray(rawTxid) ? rawTxid[0] : rawTxid;
    const result = await getServiceInsight(requestId, txid);
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.ok ? 200 : 400).json(result);
  } catch (e) {
    res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: (e as Error).message,
    });
  }
}
