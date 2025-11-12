import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a folder name.'],
  },
  description: {
    type: String,
    default: '',
  },
  // We will store the hashed password if one is provided
  password: {
    type: String,
    default: null, // null means no password is set
  },
  // Reference to the user who created it
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // To get the creator's username easily
  creatorUsername: {
    type: String,
    required: true,
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.models.Folder || mongoose.model('Folder', FolderSchema);