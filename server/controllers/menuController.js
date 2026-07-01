import * as menuService from '../services/menuService.js';
import { menuItemSchema, categorySchema } from '../validators/menuValidator.js';
import { ValidationError } from '../utils/errors.js';

export const getPublicMenuItems = (req, res, next) => {
  try {
    const items = menuService.getPublicMenuItems();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const getAdminMenuItems = (req, res, next) => {
  try {
    const { category, availability, bestseller } = req.query;
    const items = menuService.getAdminMenuItems({
      category: String(category || '').trim(),
      availability: String(availability || '').trim(),
      bestseller: String(bestseller || '').trim(),
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const createMenuItem = (req, res, next) => {
  try {
    const result = menuItemSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    const item = menuService.createMenuItem(result.data, req.user?.id);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

export const updateMenuItem = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Invalid item id.');
    }
    const result = menuItemSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    const item = menuService.updateMenuItem(id, result.data, req.user?.id);
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItem = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Invalid item id.');
    }
    menuService.deleteMenuItem(id, req.user?.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const duplicateMenuItem = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Invalid item id.');
    }
    const newId = menuService.duplicateMenuItem(id, req.user?.id);
    res.json({ success: true, id: newId });
  } catch (err) {
    next(err);
  }
};

export const getCategories = (req, res, next) => {
  try {
    const categories = menuService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const createCategory = (req, res, next) => {
  try {
    const result = categorySchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    const category = menuService.createCategory(result.data);
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Invalid category id.');
    }
    const result = categorySchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    const category = menuService.updateCategory(id, result.data);
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('Invalid category id.');
    }
    menuService.deleteCategory(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
