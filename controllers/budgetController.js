const { validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendBudgetNotification } = require('../services/emailService');

// Get all budgets for a user
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    console.error('Error getting budgets:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add a budget
exports.addBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { category, amount, period, startDate, endDate, notificationThreshold, notes } = req.body;

    const newBudget = new Budget({
      user: req.user.id,
      category,
      amount,
      period: period || 'monthly',
      startDate: startDate || Date.now(),
      endDate,
      notificationThreshold: notificationThreshold || 80,
      notes
    });

    const budget = await newBudget.save();
    res.status(201).json(budget);
  } catch (err) {
    console.error('Error adding budget:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user.id 
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found or not authorized' });
    }

    res.json({ message: 'Budget removed successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// Get budget summary with spending
exports.getBudgetSummary = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const [budgets, transactions] = await Promise.all([
      Budget.find({ user: req.user.id, isActive: true }),
      Transaction.find({ 
        user: req.user.id,
        type: 'expense',
        date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
      })
    ]);

    const budgetSummary = budgets.map(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.category);
      const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentageSpent = (totalSpent / budget.amount) * 100;
      
      return {
        ...budget.toObject(),
        totalSpent,
        percentageSpent,
        remaining: budget.amount - totalSpent,
        isOverBudget: totalSpent > budget.amount
      };
    });

    res.json(budgetSummary);
  } catch (err) {
    console.error('Error getting budget summary:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Check budget notifications
exports.checkBudgetNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.preferences?.notificationsEnabled) {
      return res.json({ message: 'Notifications are disabled for this user' });
    }

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const [budgets, transactions] = await Promise.all([
      Budget.find({ user: req.user.id, isActive: true }),
      Transaction.find({ 
        user: req.user.id,
        type: 'expense',
        date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
      })
    ]);

    const notifications = budgets.map(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.category);
      const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentageSpent = (totalSpent / budget.amount) * 100;

      if (percentageSpent >= budget.notificationThreshold) {
        return {
          budgetId: budget._id,
          category: budget.category,
          budgetAmount: budget.amount,
          amountSpent: totalSpent,
          percentageSpent: percentageSpent.toFixed(2),
          isOverBudget: totalSpent > budget.amount
        };
      }
      return null;
    }).filter(notification => notification !== null);

    res.json(notifications);
  } catch (err) {
    console.error('Error checking budget notifications:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};