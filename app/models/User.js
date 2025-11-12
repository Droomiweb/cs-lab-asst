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
});

// This prevents Mongoose from recompiling the model if it's already been compiled
export default mongoose.models.User || mongoose.model('User', UserSchema);