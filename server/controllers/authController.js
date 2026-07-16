import * as authService from '../services/authService.js';
import { signupSchema, loginSchema } from '../validators/authValidator.js';
import { ValidationError } from '../utils/errors.js';

export const signup = (req, res, next) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    
    const { token, user } = authService.signupUser(result.data);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const login = (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { token, user } = authService.loginUser(result.data);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const adminLogin = (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { token, user } = authService.loginAdmin(result.data);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const getMe = (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};
