const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendTransactionNotification } = require('../services/emailService');

// Get all transactions for a user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Add a transaction
exports.addTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { description, amount, type, category, date, paymentMethod, tags, location, notes } = req.body;

    const newTransaction = new Transaction({
      user: req.user.id,
      description,
      amount,
      type,
      category,
      date: date || Date.now(),
      paymentMethod: paymentMethod || 'cash',
      tags: tags || [],
      location,
      notes
    });

    const transaction = await newTransaction.save();

    // Get user email for notification
    const user = await User.findById(req.user.id);
    if (user && user.preferences.notificationsEnabled) {
      sendTransactionNotification(user.email, type, amount, category);
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Check user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await transaction.remove();

    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Check user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const { description, amount, type, category, date, paymentMethod, tags, location, notes } = req.body;

    // Update fields
    if (description) transaction.description = description;
    if (amount) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (date) transaction.date = date;
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (tags) transaction.tags = tags;
    if (location) transaction.location = location;
    if (notes) transaction.notes = notes;

    await transaction.save();

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Get transaction summary
exports.getTransactionSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });
    
    const balance = totalIncome - totalExpense;
    
    res.json({
      totalIncome,
      totalExpense,
      balance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get transactions by category
exports.getTransactionsByCategory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    
    const categories = {};
    
    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          total: 0,
          transactions: []
        };
      }
      
      categories[transaction.category].total += transaction.amount;
      categories[transaction.category].transactions.push(transaction);
    });
    
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
