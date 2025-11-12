import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Folder from '../../../../models/Folder';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { folderId, password } = await request.json();

    if (!folderId || !password) {
      return NextResponse.json(
        { message: 'Folder ID and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the folder, but this time, we need the password field
    const folder = await Folder.findById(folderId).select('+password');

    if (!folder) {
      return NextResponse.json(
        { message: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check if the folder even has a password
    if (!folder.password) {
      // This shouldn't happen if the client is working correctly
      return NextResponse.json(
        { message: 'This folder is not password protected' },
        { status: 400 }
      );
    }

    // --- The Main Check ---
    // Compare the submitted password with the stored hash
    const isPasswordCorrect = await bcrypt.compare(
      password,
      folder.password
    );

    if (isPasswordCorrect) {
      // Correct!
      return NextResponse.json(
        { success: true, message: 'Password verified' },
        { status: 200 }
      );
    } else {
      // Incorrect.
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 } // 401 means "Unauthorized"
      );
    }

  } catch (error) {
    return NextResponse.json(
      { message: 'Error verifying password', error: error.message },
      { status: 500 }
    );
  }
}