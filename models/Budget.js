const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationThreshold: {
    type: Number,
    default: 80 // percentage
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('budget', BudgetSchema);