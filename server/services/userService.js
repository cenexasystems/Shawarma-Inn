import { db } from '../db.js';
import { getUserById } from '../repositories/userRepository.js';

export function updateUserProfile(userId, { name, phone, avatar_url, status }) {
  const profileComplete = Number(Boolean(name && phone));

  db.prepare(
    `UPDATE users
     SET name = ?,
         phone = ?,
         avatar_url = ?,
         status = ?,
         is_profile_complete = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(name || null, phone || null, avatar_url || null, status || null, profileComplete, new Date().toISOString(), userId);

  return getUserById(userId);
}
