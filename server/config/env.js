import dotenv from 'dotenv';
dotenv.config({ override: true });

export const PORT = Number(process.env.PORT || 5000);
export const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required and must not be empty.');
  process.exit(1);
}

export const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}
