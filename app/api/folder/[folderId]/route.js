import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { del as deleteFromBlob } from '@vercel/blob'; 
import dbConnect from '@/app/lib/mongodb';
import Folder from '@/app/models/Folder';
import Image from '@/app/models/Image'; 
import Code from '@/app/models/Code';   

// --- GET Handler (No Change) ---
export async function GET(request, { params: paramsPromise }) {
  
  const params = await paramsPromise;
  const { folderId } = params;

  if (!folderId || folderId === "undefined") {
    return NextResponse.json(
      { message: 'Invalid folder ID' },
      { status: 400 } 
    );
  }

  try {
    await dbConnect();
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return NextResponse.json(
        { message: 'Folder not found' },
        { status: 404 }
      );
    }

    const folderData = {
      _id: folder._id,
      name: folder.name,
      description: folder.description,
      creatorUsername: folder.creatorUsername,
      createdBy: folder.createdBy, 
      isPasswordProtected: !!folder.password, 
    };

    return NextResponse.json(
      { folder: folderData },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching folder', error: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE Handler (MODIFIED) ---
export async function DELETE(request, { params: paramsPromise }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const params = await paramsPromise;
  const { folderId } = params;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return NextResponse.json({ message: 'Folder not found' }, { status: 404 });
    }

    // --- MODIFICATION ---
    // Allow delete if user is the creator OR if the user is an admin
    if (folder.createdBy.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'You are not authorized to delete this folder' },
        { status: 403 } 
      );
    }
    // --- END MODIFICATION ---

    const images = await Image.find({ folderId: folderId });
    if (images.length > 0) {
      const deletePromises = images.map(image => deleteFromBlob(image.url));
      await Promise.all(deletePromises);
    }

    await Image.deleteMany({ folderId: folderId });
    await Code.deleteMany({ folderId: folderId });
    await Folder.findByIdAndDelete(folderId);

    return NextResponse.json(
      { message: 'Folder and all its contents deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error deleting folder', error: error.message },
      { status: 500 }
    );
  }
}