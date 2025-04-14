const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const budgetController = require('../../controllers/budgetController');

router.use((req, res, next) => {
    console.log(`Budget route hit: ${req.method} ${req.path}`);
    next();
  });

// @route   GET api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', auth, budgetController.getBudgets);

// @route   POST api/budgets
// @desc    Add a budget
// @access  Private
router.post(
    '/',
    [
      auth,
      [
        check('category', 'Category is required').not().isEmpty(),
        check('amount', 'Amount is required and must be positive').isFloat({ min: 0 })
      ]
    ],
    (req, res, next) => {
      console.log('Reached budget POST route handler');
      console.log('Request body:', req.body);
      next();
    },
    budgetController.addBudget
  );

// @route   DELETE api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, budgetController.deleteBudget);

// @route   GET api/budgets/summary
// @desc    Get budget summary with spending
// @access  Private
router.get('/summary', auth, budgetController.getBudgetSummary);

// @route   GET api/budgets/notifications
// @desc    Check budget notifications
// @access  Private
router.get('/notifications', auth, budgetController.checkBudgetNotifications);

module.exports = router;