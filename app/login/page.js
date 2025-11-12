'use client'; // This must be a Client Component

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Import the signIn function
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Try to sign in the user
      const result = await signIn('credentials', {
        // We set redirect: false to handle errors ourselves
        redirect: false,
        username: username,
        password: password,
      });

      if (result.ok) {
        // Login was successful
        // Redirect to the homepage (or dashboard)
        router.push('/');
      } else {
        // Login failed
        // result.error will contain the error message from our authorize function
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      // This catches network errors or other unexpected issues
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-sky-800">
          Log In to Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
              {/* Show/Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Log In
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}
        </form>

        <p className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-sky-600 hover:text-sky-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}