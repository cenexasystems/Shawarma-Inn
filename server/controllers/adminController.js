import * as adminService from '../services/adminService.js';
import { ValidationError } from '../utils/errors.js';

export const getUsers = (req, res, next) => {
  try {
    const users = adminService.getAdminUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = (req, res, next) => {
  try {
    const customers = adminService.getCustomers();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      throw new ValidationError('Invalid user ID');
    }
    const { role } = req.body;
    if (role !== 'admin' && role !== 'user') {
      throw new ValidationError('Invalid role');
    }
    const user = adminService.updateUserRole(userId, role);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
