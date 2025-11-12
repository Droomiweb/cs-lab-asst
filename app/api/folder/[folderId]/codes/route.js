import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import Code from '@/app/models/Code'; // CORRECTED

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

    // Find all code snippets that have a matching folderId
    // Sort by newest first
    const codes = await Code.find({ folderId: folderId }).sort({ createdAt: -1 });

    return NextResponse.json({ codes }, { status: 200 });

  } catch (error) {
    console.error("Error fetching code snippets from API:", error);
    return NextResponse.json(
      { message: 'Error fetching code snippets', error: error.message },
      { status: 500 }
    );
  }
}