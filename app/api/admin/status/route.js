import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Folder from '@/app/models/Folder';
import Image from '@/app/models/Image';
import Code from '@/app/models/Code';

export async function GET(request) {
  // 1. Get user session
  const session = await getServerSession(authOptions);

  // 2. Check if user is an admin
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json(
      { message: 'Access Denied: You are not an admin.' },
      { status: 403 } // 403 Forbidden
    );
  }

  // 3. If admin, proceed to fetch data
  try {
    await dbConnect();

    // Fetch all users (but remove their passwords from the response!)
    const users = await User.find({}).select('-password');
    const folders = await Folder.find({});
    const images = await Image.find({});
    const codes = await Code.find({});

    // 4. Return the stats and data
    return NextResponse.json(
      {
        userCount: users.length,
        folderCount: folders.length,
        imageCount: images.length,
        codeCount: codes.length,
        users: users,
        folders: folders,
        // We could send images and codes too, but let's start with this
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching admin stats', error: error.message },
      { status: 500 }
    );
  }
}