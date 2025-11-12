import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { del } from '@vercel/blob'; 
import dbConnect from '@/app/lib/mongodb'; 
import Image from '@/app/models/Image'; 

export async function DELETE(request, { params }) {
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

    const image = await Image.findById(imageId);
    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    // --- MODIFICATION ---
    // Allow delete if user is the uploader OR if the user is an admin
    if (image.uploadedBy.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'You are not authorized to delete this image' },
        { status: 403 } 
      );
    }
    // --- END MODIFICATION ---

    await del(image.url);
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