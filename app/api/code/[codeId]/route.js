import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// This path goes up from [codeId] to 'code', then up to 'api'
import { authOptions } from '../../auth/[...nextauth]/route'; 
import dbConnect from '../../../lib/mongodb';
import Code from '../../../models/Code';

// --- GET Handler (with fix) ---
export async function GET(request, { params: paramsPromise }) {
  
  // Await the promise to get the actual params object
  const params = await paramsPromise;
  const { codeId } = params;

  try {
    await dbConnect();
    const code = await Code.findById(codeId);

    if (!code) {
      return new NextResponse('Code snippet not found', { status: 404 });
    }
    
    return new NextResponse(code.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `inline; filename="${code.filename}"`,
      },
    });

  } catch (error) {
    return new NextResponse('Error fetching code snippet', { status: 500 });
  }
}

// --- NEW DELETE Handler ---
export async function DELETE(request, { params: paramsPromise }) {
  // 1. Get user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // 2. Await and get codeId from params
  const params = await paramsPromise;
  const { codeId } = params;

  if (!codeId) {
    return NextResponse.json({ message: 'Code ID required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 3. Find the code snippet in the database
    const code = await Code.findById(codeId);
    if (!code) {
      return NextResponse.json({ message: 'Code snippet not found' }, { status: 404 });
    }

    // 4. Check if the current user is the uploader
    if (code.uploadedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this snippet' },
        { status: 403 } // 403 Forbidden
      );
    }

    // 5. Delete the code snippet from MongoDB
    await Code.findByIdAndDelete(codeId);

    return NextResponse.json(
      { message: 'Code snippet deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Error deleting code snippet', error: error.message },
      { status: 500 }
    );
  }
}