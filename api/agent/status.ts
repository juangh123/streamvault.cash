import { getAgentStatus } from '../../src/lib/agent-server.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'INVALID_REQUEST', message: 'Use GET.' });
    return;
  }
  try {
    const raw = req.query?.payerPubkey;
    const payerPubkey = Array.isArray(raw) ? raw[0] : raw;
    const status = await getAgentStatus(payerPubkey);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(status);
  } catch (e) {
    const message = (e as Error).message;
    res.status(message === 'AGENT_DISABLED' ? 503 : 400).json({
      code: message === 'AGENT_DISABLED' ? 'AGENT_DISABLED' : 'SERVER_ERROR',
      message,
    });
  }
}
