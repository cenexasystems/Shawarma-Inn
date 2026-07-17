import dotenv from 'dotenv';
dotenv.config({ override: true });

export const PORT = Number(process.env.PORT || 5000);
export const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required and must not be empty.');
  process.exit(1);
}

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://shawarma-inn-react.vercel.app',
  'https://shawarmainn.in',
  'https://www.shawarmainn.in',
];

export const allowedOrigins = Array.from(new Set([
  ...String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ...defaultAllowedOrigins,
]));
