import * as userService from '../services/userService.js';
import { updateProfileSchema } from '../validators/userValidator.js';
import { ValidationError, ForbiddenError } from '../utils/errors.js';

export const getProfile = (req, res, next) => {
  try {
    if (req.user.role !== 'user') {
      throw new ForbiddenError('Profile endpoint is for customer accounts only.');
    }
    res.json({ profile: req.user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = (req, res, next) => {
  try {
    if (req.user.role !== 'user') {
      throw new ForbiddenError('Profile endpoint is for customer accounts only.');
    }

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    // Merge with existing user data if not provided
    const payload = {
      name: result.data.name !== undefined ? result.data.name : req.user.name,
      phone: result.data.phone !== undefined ? result.data.phone : req.user.phone,
      avatar_url: result.data.avatar_url !== undefined ? result.data.avatar_url : req.user.avatar_url,
      status: result.data.status !== undefined ? result.data.status : req.user.status,
    };

    const user = userService.updateUserProfile(req.user.id, payload);
    res.json({ profile: user, user });
  } catch (err) {
    next(err);
  }
};
