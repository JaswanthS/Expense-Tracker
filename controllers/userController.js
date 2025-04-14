const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');
require('dotenv').config();

// Register user
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    user = new User({
      name,
      email,
      password
    });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Send welcome email
    sendWelcomeEmail(name, email);

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update user preferences
exports.updateUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const { currency, theme, notificationsEnabled, monthlyBudget } = req.body;
    
    // Update fields
    if (currency) user.preferences.currency = currency;
    if (theme) user.preferences.theme = theme;
    if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;
    if (monthlyBudget) user.monthlyBudget = monthlyBudget;
    
    await user.save();
    
    res.json(user.preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
