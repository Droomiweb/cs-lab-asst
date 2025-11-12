import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/app/lib/mongodb'; // CORRECTED
import User from '@/app/models/User'; // CORRECTED

export async function POST(request) {
  try {
    // 1. Get the username and password from the request body
    const { username, password } = await request.json();

    // 2. Hash the password
    // A salt round of 10 is a good balance between security and performance
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Connect to the database
    await dbConnect();

    // 4. Create the new user in the database
    await User.create({
      username: username,
      password: hashedPassword,
    });

    // 5. Send a success response
    return NextResponse.json(
      { message: 'User created successfully!' },
      { status: 201 } // 201 means "Created"
    );

  } catch (error) {
    // Handle errors (e.g., duplicate username)
    if (error.code === 11000) { // MongoDB duplicate key error
      return NextResponse.json(
        { message: 'Username already exists.' },
        { status: 400 } // 400 means "Bad Request"
      );
    }
    
    // Other errors
    return NextResponse.json(
      { message: 'An error occurred.', error: error.message },
      { status: 500 } // 500 means "Internal Server Error"
    );
  }
}