import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import dbConnect from '@/app/lib/mongodb'; 
import Code from '@/app/models/Code'; 

// --- GET Handler (No Change) ---
export async function GET(request, { params: paramsPromise }) {
  
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

// --- DELETE Handler (MODIFIED) ---
export async function DELETE(request, { params: paramsPromise }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const params = await paramsPromise;
  const { codeId } = params;

  if (!codeId) {
    return NextResponse.json({ message: 'Code ID required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const code = await Code.findById(codeId);
    if (!code) {
      return NextResponse.json({ message: 'Code snippet not found' }, { status: 404 });
    }

    // --- MODIFICATION ---
    // Allow delete if user is the uploader OR if the user is an admin
    if (code.uploadedBy.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'You are not authorized to delete this snippet' },
        { status: 403 }
      );
    }
    // --- END MODIFICATION ---

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