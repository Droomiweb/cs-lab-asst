import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Folder from '@/app/models/Folder';
import Image from '@/app/models/Image';
import Code from '@/app/models/Code';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { message: 'Access Denied: You are not an admin.' },
      { status: 403 }
    );
  }

  try {
    await dbConnect();

    const users = await User.find({}).select('-password');
    const folders = await Folder.find({});
    const images = await Image.find({});
    const codes = await Code.find({});

    // --- MODIFIED: Return all data ---
    return NextResponse.json(
      {
        userCount: users.length,
        folderCount: folders.length,
        imageCount: images.length,
        codeCount: codes.length,
        users: users,
        folders: folders,
        images: images, // Added
        codes: codes    // Added
      },
      { status: 200 }
    );
    // --- END MODIFICATION ---

  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching admin stats', error: error.message },
      { status: 500 }
    );
  }
}