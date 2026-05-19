import { createHmac, timingSafeEqual } from 'node:crypto';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  role: 'ADMIN' | 'MAHASISWA' | 'DOSEN';
}

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    '=',
  );

  return Buffer.from(
    padded.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString();
}

function signValue(value: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(value)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signToken(payload: AuthTokenPayload, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const unsigned = `${header}.${body}`;

  return `${unsigned}.${signValue(unsigned, secret)}`;
}

export function verifyToken(token: string, secret: string): AuthTokenPayload {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new Error('Invalid token');
  }

  const unsigned = `${header}.${body}`;
  const expectedSignature = signValue(unsigned, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const parsed = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload & {
    exp?: number;
  };

  if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return {
    sub: parsed.sub,
    username: parsed.username,
    role: parsed.role,
  };
}
