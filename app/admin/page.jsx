'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // This effect runs when session status is determined
    if (status === 'loading') {
      return; // Wait until session is loaded
    }

    if (status === 'unauthenticated') {
      router.replace('/login'); // Redirect to login if not logged in
      return;
    }

    if (session && session.user.role !== 'admin') {
      router.replace('/'); // Redirect to home if not an admin
      return;
    }

    // If we are here, user is an admin. Fetch the data.
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          throw new Error('Failed to fetch admin data. Are you an admin?');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();

  }, [session, status, router]);

  // --- Render States ---

  // 1. Loading session or data
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-xl text-gray-800">Loading Admin Dashboard...</p>
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  // 3. Main dashboard content
  if (session && session.user.role === 'admin' && stats) {
    return (
      <div className="container p-4 mx-auto max-w-7xl">
        <h1 className="pb-4 mb-6 text-3xl font-bold border-b border-gray-300 text-indigo-900">
          Admin Dashboard
        </h1>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.userCount} />
          <StatCard title="Total Folders" value={stats.folderCount} />
          <StatCard title="Total Images" value={stats.imageCount} />
          <StatCard title="Total Code Snippets" value={stats.codeCount} />
        </div>

        {/* --- Data Lists --- */}
        <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
          {/* User List */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-indigo-800">
              All Users ({stats.userCount})
            </h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {stats.users.map(user => (
                <li key={user._id} className="flex justify-between p-2 border-b">
                  <span>{user.username}</span>
                  <span className={`font-medium ${
                    user.role === 'admin' ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {user.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Folder List */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-indigo-800">
              All Folders ({stats.folderCount})
            </h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {stats.folders.map(folder => (
                <li key={folder._id} className="flex justify-between p-2 border-b">
                  <span>{folder.name}</span>
                  <span className="text-sm text-gray-500">
                    by {folder.creatorUsername}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    );
  }

  // Fallback for any other state (e.g., redirecting)
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <p className="text-xl text-gray-800">Loading...</p>
    </div>
  );
}

// A helper component for the stat cards
function StatCard({ title, value }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}