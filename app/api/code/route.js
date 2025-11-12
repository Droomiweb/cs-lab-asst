import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // CORRECTED
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import Code from '@/app/models/Code'; // CORRECTED

export async function POST(request) {
  // 1. Check for authenticated user
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { filename, content, folderId } = await request.json();

    // 2. Validate input
    if (!filename || !content || !folderId) {
      return NextResponse.json(
        { message: 'Filename, content, and folderId are required' },
        { status: 400 }
      );
    }

    if (content.split('\n').length > 600) {
      return NextResponse.json(
        { message: 'Code snippet must be less than 600 lines.' },
        { status: 400 }
      );
    }
    
    // 3. Connect to DB and create
    await dbConnect();
    const newCode = await Code.create({
      filename,
      content,
      folderId,
      uploadedBy: session.user.id,
      uploaderUsername: session.user.username,
    });

    // 4. Return the new code object
    return NextResponse.json(newCode, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { message: 'Error saving code snippet', error: error.message },
      { status: 500 }
    );
  }
}