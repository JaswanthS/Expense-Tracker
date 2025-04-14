const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));
app.use(morgan('dev'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/transactions', require('./routes/api/transactions'));
app.use('/api/budgets', require('./routes/api/budgets'));

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
