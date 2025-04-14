const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const { sendTransactionNotification } = require('../../services/emailService');

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/transactions
// @desc    Add a transaction
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('description', 'Description is required').not().isEmpty(),
      check('amount', 'Amount is required').not().isEmpty(),
      check('type', 'Type is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
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
  }
);

// @route   DELETE api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
  
      if (!transaction) {
        return res.status(404).json({ msg: 'Transaction not found' });
      }
  
      // Check user
      if (transaction.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      // Replace deprecated transaction.remove() with findByIdAndDelete
      await Transaction.findByIdAndDelete(req.params.id);
  
      res.json({ msg: 'Transaction removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Transaction not found' });
      }
      res.status(500).send('Server Error');
    }
  });
  

// @route   PUT api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
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
});

// @route   GET api/transactions/summary
// @desc    Get transaction summary (income, expense, balance)
// @access  Private
router.get('/summary', auth, async (req, res) => {
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
});

// @route   GET api/transactions/categories
// @desc    Get transactions grouped by categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
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
});

module.exports = router;
