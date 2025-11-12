import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import Folder from '@/app/models/Folder'; // CORRECTED

// Note the change here: { params: paramsPromise }
export async function GET(request, { params: paramsPromise }) {
  
  // --- THE FIX ---
  // Await the promise to get the actual params object
  const params = await paramsPromise;
  // --- END FIX ---

  // Now this will work correctly
  const { folderId } = params;

  // This guard will now correctly check the real folderId
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

    // --- IMPORTANT ---
    // We send back the folder's public data.
    // We do NOT send the hashed password.
    // Instead, we just send a boolean letting the
    // client know if a password is set or not.

    const folderData = {
      _id: folder._id,
      name: folder.name,
      description: folder.description,
      creatorUsername: folder.creatorUsername,
      // !!folder.password is a trick to turn a string (or null) into a boolean
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