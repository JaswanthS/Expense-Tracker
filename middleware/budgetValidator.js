const { check } = require('express-validator');

exports.budgetValidator = [
  check('category', 'Category is required').not().isEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
  check('period', 'Invalid period').optional().isIn(['weekly', 'monthly', 'quarterly', 'yearly']),
  check('notificationThreshold', 'Threshold must be between 0 and 100').optional().isInt({ min: 0, max: 100 })
];