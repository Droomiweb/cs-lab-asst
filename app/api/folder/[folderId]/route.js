import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { del as deleteFromBlob } from '@vercel/blob'; // Import Vercel Blob delete
import dbConnect from '@/app/lib/mongodb';
import Folder from '@/app/models/Folder';
import Image from '@/app/models/Image'; // Need this to delete images
import Code from '@/app/models/Code';   // Need this to delete codes

// --- GET Handler (Existing) ---
export async function GET(request, { params: paramsPromise }) {
  
  // Await the promise to get the actual params object
  const params = await paramsPromise;
  const { folderId } = params;

  if (!folderId || folderId === "undefined") {
    return NextResponse.json(
      { message: 'Invalid folder ID' },
      { status: 400 } // 400 Bad Request
    );
  }

  try {
    await dbConnect();

    // Find the folder by its ID
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
      createdBy: folder.createdBy, // --- MODIFIED: Send createdBy ID ---
      isPasswordProtected: !!folder.password, 
    };

    return NextResponse.json(
      { folder: folderData },
      { status: 200 }
    );

  } catch (error) {
    // This catches invalid ObjectIDs or other server errors
    return NextResponse.json(
      { message: 'Error fetching folder', error: error.message },
      { status: 500 }
    );
  }
}

// --- NEW DELETE Handler ---
export async function DELETE(request, { params: paramsPromise }) {
  // 1. Get user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // 2. Get folderId
  const params = await paramsPromise;
  const { folderId } = params;

  if (!folderId) {
    return NextResponse.json({ message: 'Folder ID required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 3. Find the folder
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return NextResponse.json({ message: 'Folder not found' }, { status: 404 });
    }

    // 4. Check authorization
    if (folder.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this folder' },
        { status: 403 } // 403 Forbidden
      );
    }

    // 5. Find all associated images and delete them from Vercel Blob
    const images = await Image.find({ folderId: folderId });
    if (images.length > 0) {
      // Create an array of delete promises
      const deletePromises = images.map(image => deleteFromBlob(image.url));
      // Wait for all blob deletions to complete
      await Promise.all(deletePromises);
    }

    // 6. Delete all associated Image and Code documents from MongoDB
    await Image.deleteMany({ folderId: folderId });
    await Code.deleteMany({ folderId: folderId });

    // 7. Delete the folder itself
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