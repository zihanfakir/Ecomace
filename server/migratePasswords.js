require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Store } = require('./data/db'); // ensure path is correct

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const doc = await Store.findOne({ docId: 'main' });
    if (!doc || !doc.state || !doc.state.users) {
      console.log('No users found to migrate.');
      process.exit(0);
    }

    let modifiedCount = 0;
    const users = doc.state.users;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Check if password exists and is NOT a bcrypt hash (bcrypt hashes start with $2a$ or $2b$)
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`Hashing password for user: ${user.email}`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        modifiedCount++;
      }
    }

    if (modifiedCount > 0) {
      // mongoose mixed types need markModified
      doc.markModified('state');
      await doc.save();
      console.log(`Successfully hashed passwords for ${modifiedCount} users.`);
    } else {
      console.log('All user passwords are already hashed.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
