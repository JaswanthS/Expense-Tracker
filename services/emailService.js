const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendWelcomeEmail = async (name, email) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Expense Tracker!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2c3e50;">Welcome to Expense Tracker, ${name}!</h2>
          <p>Thank you for joining our platform. We're excited to help you manage your finances more effectively.</p>
          <p>With Expense Tracker, you can:</p>
          <ul>
            <li>Track your income and expenses</li>
            <li>Categorize transactions</li>
            <li>Visualize your spending patterns</li>
            <li>Set budgets and financial goals</li>
          </ul>
          <p>Get started by adding your first transaction!</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0;">Need help? Contact our support team at <a href="mailto:support@expensetracker.com">support@expensetracker.com</a></p>
          </div>
        </div>
      `
    });
    console.log('Welcome email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

const sendTransactionNotification = async (email, transactionType, amount, category) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New ${transactionType} Recorded in Expense Tracker`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2c3e50;">Transaction Notification</h2>
          <p>A new ${transactionType} of $${amount} has been recorded in your account under the category "${category}".</p>
          <p>Log in to your account to view more details.</p>
        </div>
      `
    });
    console.log('Transaction notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending transaction notification email:', error);
    return false;
  }
};

const sendBudgetNotification = async (email, category, spent, budget, percentage, isOver) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: isOver 
        ? `Budget Exceeded for ${category}` 
        : `Budget Alert for ${category}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: ${isOver ? '#e74c3c' : '#f39c12'};">
            ${isOver ? 'Budget Exceeded!' : 'Budget Alert'}
          </h2>
          <p>Your ${category} budget:</p>
          <ul>
            <li>Budget Amount: $${budget.toFixed(2)}</li>
            <li>Amount Spent: $${spent.toFixed(2)}</li>
            <li>Percentage Used: ${percentage}%</li>
          </ul>
          <p>${isOver 
            ? 'You have exceeded your budget for this category.' 
            : 'You are approaching your budget limit for this category.'}
          </p>
        </div>
      `
    });
    console.log('Budget notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending budget notification email:', error);
    return false;
  }
};

// Add to your module.exports at the bottom of the file:
module.exports = {
  sendWelcomeEmail,
  sendTransactionNotification,
  sendBudgetNotification
};

