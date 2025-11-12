import { NextResponse } from 'next/server';
import { put } from '@vercel/blob'; // Vercel Blob upload function
import { getServerSession } from 'next-auth/next';
// --- FIX: Go up one directory first ---
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path if needed
import dbConnect from '../../lib/mongodb';
import Image from '../../models/Image'; // Your Image model

export async function POST(request) {
  // 1. Check for authenticated user
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // 2. Get folderId and filename from the URL query parameters
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  const filename = searchParams.get('filename');

  if (!folderId || !filename) {
    return NextResponse.json(
      { message: 'Folder ID and filename are required' },
      { status: 400 }
    );
  }

  // 3. Get the file (which is the request body)
  const fileBlob = request.body;
  if (!fileBlob) {
    return NextResponse.json({ message: 'No file body found' }, { status: 400 });
  }

  try {
    // 4. Upload the file to Vercel Blob
    const { url } = await put(filename, fileBlob, {
      access: 'public', // Make the file publicly accessible
    });

    // 5. Connect to DB and save the new image's metadata
    await dbConnect();
    const newImage = await Image.create({
      url: url,
      filename: filename,
      folderId: folderId,
      uploadedBy: session.user.id,
      uploaderUsername: session.user.username,
    });

    // 6. Return the new image data
    return NextResponse.json(newImage, { status: 201 });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Error uploading image', error: error.message },
      { status: 500 }
    );
  }
}