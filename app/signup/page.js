'use client'; // This must be a Client Component to use hooks (useState, etc.)

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use 'next/navigation' in App Router
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // User created successfully
        setMessage('Signup successful! Redirecting to login...');
        // Redirect to the login page after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Handle errors (e.g., username already exists)
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-sky-800">
          Create Your Account
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
              Sign Up
            </button>
          </div>

          {/* Error and Message Display */}
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}
          {message && (
            <p className="text-sm text-center text-green-500">{message}</p>
          )}
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-sky-600 hover:text-sky-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}