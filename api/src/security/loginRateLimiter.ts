// Limita tentativas de login erradas por (IP + e-mail): proteção básica contra força bruta.
// Em memória — com várias instâncias da API, mover para Redis ou para o banco.
export class LoginRateLimiter {
  private failures = new Map<string, { count: number; firstAt: number }>();

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000
  ) {}

  private key(ip: string, email: string) {
    return `${ip}|${email.trim().toLowerCase()}`;
  }

  /** Segundos até liberar, ou 0 se pode tentar. */
  retryAfter(ip: string, email: string, now = Date.now()): number {
    const entry = this.failures.get(this.key(ip, email));
    if (!entry) return 0;
    if (now - entry.firstAt > this.windowMs) {
      this.failures.delete(this.key(ip, email));
      return 0;
    }
    return entry.count >= this.maxFailures ? Math.ceil((entry.firstAt + this.windowMs - now) / 1000) : 0;
  }

  fail(ip: string, email: string, now = Date.now()): void {
    const k = this.key(ip, email);
    const entry = this.failures.get(k);
    if (!entry || now - entry.firstAt > this.windowMs) this.failures.set(k, { count: 1, firstAt: now });
    else entry.count += 1;
  }

  reset(ip: string, email: string): void {
    this.failures.delete(this.key(ip, email));
  }
}
