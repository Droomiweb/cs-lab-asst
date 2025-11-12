import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // CORRECTED
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import Folder from '@/app/models/Folder'; // CORRECTED
import bcrypt from 'bcrypt';

// --- GET: Fetch all folders ---
export async function GET() {
  try {
    await dbConnect();

    // Find all folders, sort by newest first
    const folders = await Folder.find({}).sort({ createdAt: -1 });

    return NextResponse.json(
      { folders },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching folders', error: error.message },
      { status: 500 }
    );
  }
}

// --- POST: Create a new folder ---
export async function POST(request) {
  // 1. Get the authenticated session
  // We use getServerSession for server-side session access
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const { name, description, password } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Folder name is required' },
        { status: 400 }
      );
    }

    let hashedPassword = null;
    // Hash the password only if it's provided and not empty
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 4. Create the new folder
    const newFolder = await Folder.create({
      name,
      description,
      password: hashedPassword,
      createdBy: session.user.id, // Get user ID from session
      creatorUsername: session.user.username // Get username from session
    });

    return NextResponse.json(
      { message: 'Folder created!', folder: newFolder },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error creating folder', error: error.message },
      { status: 500 }
    );
  }
}