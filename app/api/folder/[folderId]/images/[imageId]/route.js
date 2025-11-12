import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // CORRECTED
import { del } from '@vercel/blob'; // Import the 'del' function
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import Image from '@/app/models/Image'; // CORRECTED

export async function DELETE(request, { params }) {
  // 1. Get user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { imageId } = params;
  if (!imageId) {
    return NextResponse.json({ message: 'Image ID required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 2. Find the image in the database
    const image = await Image.findById(imageId);
    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    // 3. Check if the current user is the uploader
    // We compare the session user's ID with the image's 'uploadedBy' field
    if (image.uploadedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this image' },
        { status: 403 } // 403 Forbidden
      );
    }

    // 4. Delete the file from Vercel Blob storage
    // The 'image.url' is the public URL we need to pass to 'del'
    await del(image.url);

    // 5. Delete the image record from MongoDB
    await Image.findByIdAndDelete(imageId);

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error deleting image', error: error.message },
      { status: 500 }
    );
  }
}