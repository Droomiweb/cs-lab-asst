import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
// Make sure this path is correct, or use the alias '@/models/Image'
import Image from '@/models/Image'; 

// Note the change here: { params: paramsPromise }
export async function GET(request, { params: paramsPromise }) {

  // --- THE FIX ---
  // Await the promise to get the actual params object
  const params = await paramsPromise;
  // --- END FIX ---
  
  const { folderId } = params;

  // --- ADDED GUARD ---
  if (!folderId || folderId === "undefined") {
    return NextResponse.json(
      { message: 'Folder ID is required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Find all images that have a matching folderId
    // Sort by newest first
    const images = await Image.find({ folderId: folderId }).sort({ createdAt: -1 });

    return NextResponse.json({ images }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching images', error: error.message },
      { status: 500 }
    );
  }
}