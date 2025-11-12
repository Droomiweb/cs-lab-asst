import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  // The public URL from Vercel Blob
  url: {
    type: String,
    required: [true, 'Image URL is required.'],
  },
  filename: {
    type: String,
    required: [true, 'Filename is required.'],
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

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);