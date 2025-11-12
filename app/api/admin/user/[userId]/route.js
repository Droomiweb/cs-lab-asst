import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { del as deleteFromBlob } from '@vercel/blob';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Folder from '@/app/models/Folder';
import Image from '@/app/models/Image';
import Code from '@/app/models/Code';

// --- Helper function to check for admin ---
async function isAdmin(session) {
  if (!session || session.user.role !== 'admin') {
    return false;
  }
  return true;
}

// --- PUT: Make a user an admin ---
export async function PUT(request, { params: paramsPromise }) {
  const session = await getServerSession(authOptions);
  if (!await isAdmin(session)) {
    return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
  }

  const params = await paramsPromise;
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ message: 'User ID required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Set role to admin
    user.role = 'admin';
    await user.save();

    return NextResponse.json(
      { message: `User ${user.username} is now an admin` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating user role', error: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE: Remove a user and all their content ---
export async function DELETE(request, { params: paramsPromise }) {
  const session = await getServerSession(authOptions);
  if (!await isAdmin(session)) {
    return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
  }

  const params = await paramsPromise;
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ message: 'User ID required' }, { status: 400 });
  }
  
  // Prevent admin from deleting themselves
  if (session.user.id === userId) {
    return NextResponse.json({ message: 'Admin cannot delete themselves' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 1. Find all folders created by this user
    const folders = await Folder.find({ createdBy: userId });

    // 2. For each folder, delete all its contents (images, codes)
    for (const folder of folders) {
      // Find and delete all images from blob storage
      const imagesInFolder = await Image.find({ folderId: folder._id });
      if (imagesInFolder.length > 0) {
        await Promise.all(imagesInFolder.map(img => deleteFromBlob(img.url)));
      }
      // Delete all image and code documents from DB for this folder
      await Image.deleteMany({ folderId: folder._id });
      await Code.deleteMany({ folderId: folder._id });
      
      // Delete the folder itself
      await Folder.findByIdAndDelete(folder._id);
    }

    // 3. Delete all remaining content uploaded by the user (to other people's folders)
    // Find all images uploaded by user
    const imagesUploadedByUser = await Image.find({ uploadedBy: userId });
    if (imagesUploadedByUser.length > 0) {
       await Promise.all(imagesUploadedByUser.map(img => deleteFromBlob(img.url)));
    }
    // Delete all image/code docs uploaded by user
    await Image.deleteMany({ uploadedBy: userId });
    await Code.deleteMany({ uploadedBy: userId });

    // 4. Finally, delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: 'User and all associated content deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error deleting user', error: error.message },
      { status: 500 }
    );
  }
}