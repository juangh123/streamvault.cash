export interface AgentRequestStore {
  checkRateLimit(ip: string, limitPerMinute: number): Promise<boolean>;
  claimRequestId(requestId: string): Promise<boolean>;
}

export class MemoryAgentRequestStore implements AgentRequestStore {
  private readonly requestTimes = new Map<string, number[]>();
  private readonly usedRequestIds = new Set<string>();

  async checkRateLimit(ip: string, limitPerMinute: number): Promise<boolean> {
    const now = Date.now();
    const recent = (this.requestTimes.get(ip) ?? []).filter((time) => now - time < 60_000);
    if (recent.length >= limitPerMinute) {
      this.requestTimes.set(ip, recent);
      return false;
    }
    recent.push(now);
    this.requestTimes.set(ip, recent);
    return true;
  }

  async claimRequestId(requestId: string): Promise<boolean> {
    if (this.usedRequestIds.has(requestId)) return false;
    this.usedRequestIds.add(requestId);
    return true;
  }
}

interface RedisResponse {
  result?: unknown;
  error?: string;
}

export class RedisRestAgentRequestStore implements AgentRequestStore {
  private readonly endpoint: string;
  private readonly token: string;
  private readonly requestTtlSeconds: number;

  constructor(endpoint: string, token: string, requestTtlSeconds: number) {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.token = token;
    this.requestTtlSeconds = requestTtlSeconds;
  }

  private async command(...args: string[]): Promise<unknown> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const body = (await response.json()) as RedisResponse;
    if (!response.ok || body.error) {
      throw new Error(`Agent request store failed: ${body.error ?? response.statusText}`);
    }
    return body.result;
  }

  async checkRateLimit(ip: string, limitPerMinute: number): Promise<boolean> {
    const minute = Math.floor(Date.now() / 60_000);
    const key = `streamvault:rate:${ip}:${minute}`;
    const count = Number(
      await this.command(
        'EVAL',
        "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
        '1',
        key,
        '120',
      ),
    );
    return count <= limitPerMinute;
  }

  async claimRequestId(requestId: string): Promise<boolean> {
    const result = await this.command(
      'SET',
      `streamvault:request:${requestId}`,
      '1',
      'NX',
      'EX',
      String(this.requestTtlSeconds),
    );
    return result === 'OK';
  }
}

let sharedStore: AgentRequestStore | null = null;

export function getAgentRequestStore(): AgentRequestStore {
  if (sharedStore) return sharedStore;
  const endpoint = (process.env.AGENT_STORE_URL ?? '').trim();
  const token = (process.env.AGENT_STORE_TOKEN ?? '').trim();
  if (Boolean(endpoint) !== Boolean(token)) {
    throw new Error('AGENT_STORE_URL and AGENT_STORE_TOKEN must be configured together.');
  }
  if (!endpoint) {
    sharedStore = new MemoryAgentRequestStore();
    return sharedStore;
  }
  const ttl = Number(process.env.AGENT_REQUEST_TTL_SECONDS ?? '86400');
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error('AGENT_REQUEST_TTL_SECONDS must be a positive integer.');
  }
  sharedStore = new RedisRestAgentRequestStore(endpoint, token, ttl);
  return sharedStore;
}
