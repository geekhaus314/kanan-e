import { NextRequest, NextResponse } from 'next/server';

// Allowed IPs from env (comma-separated). Supports CIDR.
const ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function ipMatches(ip: string, allowed: string): boolean {
  if (allowed.includes('/')) {
    // CIDR match
    const [rangeIp, bits] = allowed.split('/');
    const mask = parseInt(bits, 10);
    const ipParts = ip.split('.').map(Number);
    const rangeParts = rangeIp.split('.').map(Number);
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];
    const maskNum = ~((1 << (32 - mask)) - 1);
    return (ipNum & maskNum) === (rangeNum & maskNum);
  }
  return ip === allowed;
}

function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  // Fallback - in development this might be ::1 or 127.0.0.1
  return '127.0.0.1';
}

export function adminIpGuard(request: NextRequest): NextResponse | null {
  // If no IPs configured, allow all (development)
  if (ALLOWED_IPS.length === 0) return null;

  const clientIp = getClientIp(request);
  const allowed = ALLOWED_IPS.some(range => ipMatches(clientIp, range));

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: IP not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
