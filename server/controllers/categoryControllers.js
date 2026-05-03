const Category = require('../models/categoryModels');
const Product = require('../models/productModels');

const categoryController = {
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({ include: [Product] });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getCategoryById: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id, { include: [Product] });
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createCategory: async (req, res) => {
    try {
      const category = await Category.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  updateCategory: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      await category.update(req.body);
      res.json({ message: 'Category updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      await category.destroy();
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = categoryController;
