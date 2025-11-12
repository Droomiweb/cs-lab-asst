import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Folder from '../../../models/Folder';

// Note the change here: { params: paramsPromise }
export async function GET(request, { params: paramsPromise }) {
  
  // --- THE FIX ---
  // Await the promise to get the actual params object
  const params = await paramsPromise;
  // --- END FIX ---

  console.log(`--- NEW REQUEST ---`);
  console.log("Request URL:", request.url);
  console.log("Received params object (now resolved):", params);

  // Now this will work correctly
  const { folderId } = params;
  console.log("Extracted folderId:", folderId);

  // This guard will now correctly check the real folderId
  if (!folderId || folderId === "undefined") {
    console.warn(`Request stopped: folderId is '${folderId}'. URL:`, request.url);
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
    // ... (rest of your original code)

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
    console.error(`Error fetching folder ${folderId}:`, error.message); 
    return NextResponse.json(
      { message: 'Error fetching folder', error: error.message },
      { status: 500 }
    );
  }
}