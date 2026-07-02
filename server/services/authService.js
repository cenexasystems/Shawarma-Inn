import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config/env.js';
import { getUserById } from '../repositories/userRepository.js';
import { broadcastSSE } from '../events/sse.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

export function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function signupUser({ email, password, name }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new ConflictError('Email already exists.');
  }

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);
  const profileComplete = Number(Boolean(name));

  const result = db
    .prepare(
      `INSERT INTO users (
        email,
        password_hash,
        role,
        name,
        provider,
        status,
        is_profile_complete,
        created_at,
        updated_at
      ) VALUES (?, ?, 'user', ?, 'local', ?, ?, ?, ?)`
    )
    .run(email, passwordHash, name || null, 'Customer', profileComplete, now, now);

  const user = getUserById(result.lastInsertRowid);
  const token = createToken(user);

  broadcastSSE('customer_registered', { email: user.email, name: user.name });

  return { token, user };
}

export function loginUser({ email, password }) {
  const row = db
    .prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .get(email);

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new UnauthorizedError('Invalid credentials.');
  }

  if (row.role !== 'user') {
    throw new UnauthorizedError('Use admin login for administrator accounts.');
  }

  const user = getUserById(row.id);
  const token = createToken(user);

  return { token, user };
}

export function loginAdmin({ email, password }) {
  const row = db
    .prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .get(email);

  if (!row || row.role !== 'admin' || !bcrypt.compareSync(password, row.password_hash)) {
    throw new UnauthorizedError('Invalid admin credentials.');
  }

  const user = getUserById(row.id);
  const token = createToken(user);

  return { token, user };
}
