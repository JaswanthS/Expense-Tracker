const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  tags: [String],
  location: {
    type: String
  },
  notes: {
    type: String
  }
});

module.exports = mongoose.model('transaction', TransactionSchema);
