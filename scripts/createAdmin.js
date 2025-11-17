const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Default admin user already exists');
      return;
    }

    const admin = new Admin({
      username: 'admin',
      password: 'admin123', // Default password
      role: 'admin'
    });

    await admin.save();
    console.log('Default admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createDefaultAdmin();
  process.exit(0);
};

main();
