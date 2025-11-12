import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  // --- NEW ---
  // Add a role field. 'user' is the default for all new signups.
  role: {
    type: String,
    enum: ['user', 'admin'], // Only 'user' or 'admin' are allowed
    default: 'user',
  },
});

// This prevents Mongoose from recompiling the model if it's already been compiled
export default mongoose.models.User || mongoose.model('User', UserSchema);