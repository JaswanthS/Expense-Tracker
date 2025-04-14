const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    theme: {
      type: String,
      default: 'light'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  }
});

module.exports = mongoose.model('user', UserSchema);
