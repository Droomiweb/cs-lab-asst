'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession(); // Get session data

  return (
    <nav className="flex items-center justify-between p-4 shadow-md bg-sky-700 text-white">
      <Link href="/" className="text-2xl font-bold">
        FileShare
      </Link>
      <div className="flex items-center space-x-4">
        {status === 'loading' && (
          <p className="text-sm">Loading...</p> // Show loading state
        )}

        {status === 'authenticated' && session.user && (
          <>
            <span className="text-sm">Welcome, {session.user.username}!</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })} // Log out and redirect to home
              className="px-4 py-2 font-semibold bg-sky-500 rounded-md hover:bg-sky-600"
            >
              Log Out
            </button>
          </>
        )}

        {status === 'unauthenticated' && (
          <>
            <Link
              href="/login"
              className="px-4 py-2 font-semibold bg-sky-500 rounded-md hover:bg-sky-600"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 font-semibold text-sky-700 bg-white rounded-md hover:bg-gray-100"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}