import mongoose from 'mongoose';

const CodeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required.'],
  },
  content: {
    type: String,
    required: [true, 'Code content is required.'],
    maxlength: [30000, 'Code snippet is too long.'] // A generous limit
  },
  // Link to the folder it's inside
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true,
  },
  // Link to the user who uploaded it
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Store username for easy display
  uploaderUsername: {
    type: String,
    required: true,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

export default mongoose.models.Code || mongoose.model('Code', CodeSchema);