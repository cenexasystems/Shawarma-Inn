import { db, mapUserRow } from '../db.js';

export function getUserById(userId) {
  const row = db
    .prepare(
      `SELECT
        id,
        email,
        role,
        name,
        phone,
        avatar_url,
        status,
        provider,
        is_profile_complete
      FROM users
      WHERE id = ?`,
    )
    .get(Number(userId));

  return mapUserRow(row);
}
