'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Stats will hold all our data now
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/status');
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

  useEffect(() => {
    if (status === 'loading') {
      return; 
    }
    if (status === 'unauthenticated') {
      router.replace('/login'); 
      return;
    }
    if (session && session.user.role !== 'admin') {
      router.replace('/'); 
      return;
    }
    if (session) {
      fetchAdminData();
    }
  }, [session, status, router]);

  // --- NEW HANDLER: Make User Admin ---
  const handleMakeAdmin = async (userId, username) => {
    if (!confirm(`Are you sure you want to make "${username}" an admin?`)) return;
    
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/user/${userId}`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');

      setMessage(data.message);
      // Update local state
      setStats(prevStats => ({
        ...prevStats,
        users: prevStats.users.map(u => 
          u._id === userId ? { ...u, role: 'admin' } : u
        ),
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NEW HANDLER: Delete User ---
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to DELETE "${username}"? This will delete all folders, images, and code snippets they created. This cannot be undone.`)) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/user/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');
      
      setMessage(data.message);
      // Refetch all data to ensure consistency
      fetchAdminData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NEW HANDLER: Delete Folder (Admin) ---
  const handleDeleteFolder = async (folderId, folderName) => {
    if (!confirm(`Are you sure you want to DELETE the folder "${folderName}" and all its contents?`)) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/folder/${folderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete folder');

      setMessage(data.message);
      // Refetch data
      fetchAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NEW HANDLER: Delete Image (Admin) ---
  const handleDeleteImage = async (imageId, folderId) => {
    if (!confirm(`Are you sure you want to DELETE this image?`)) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/folder/${folderId}/images/${imageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete image');

      setMessage(data.message);
      // Update local state
      setStats(prevStats => ({
        ...prevStats,
        images: prevStats.images.filter(img => img._id !== imageId),
        imageCount: prevStats.imageCount - 1
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NEW HANDLER: Delete Code (Admin) ---
  const handleDeleteCode = async (codeId) => {
    if (!confirm(`Are you sure you want to DELETE this code snippet?`)) return;

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/code/${codeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete code');

      setMessage(data.message);
      // Update local state
      setStats(prevStats => ({
        ...prevStats,
        codes: prevStats.codes.filter(c => c._id !== codeId),
        codeCount: prevStats.codeCount - 1
      }));
    } catch (err) {
      setError(err.message);
    }
  };


  // --- Render States ---
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-xl text-gray-800">Loading Admin Dashboard...</p>
      </div>
    );
  }

  // Error state for data fetching
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  // --- Main dashboard content ---
  if (session && session.user.role === 'admin' && stats) {
    return (
      <div className="container p-4 mx-auto max-w-7xl">
        <h1 className="pb-4 mb-6 text-3xl font-bold border-b border-gray-300 text-indigo-900">
          Admin Dashboard
        </h1>

        {/* --- Status Messages --- */}
        {error && <p className="p-4 mb-4 text-red-800 bg-red-100 border border-red-300 rounded-md">Error: {error}</p>}
        {message && <p className="p-4 mb-4 text-green-800 bg-green-100 border border-green-300 rounded-md">Success: {message}</p>}

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
          <DataList title={`All Users (${stats.userCount})`}>
            {stats.users.map(user => (
              <li key={user._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 border-b">
                <div className="mb-2 sm:mb-0">
                  <span className="font-medium">{user.username}</span>
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {/* Do not allow admin to delete themselves */}
                {session.user.id !== user._id && (
                  <div className="flex space-x-2">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleMakeAdmin(user._id, user.username)}
                        className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        Make Admin
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteUser(user._id, user.username)}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                      Delete User
                    </button>
                  </div>
                )}
              </li>
            ))}
          </DataList>

          {/* Folder List */}
          <DataList title={`All Folders (${stats.folderCount})`}>
            {stats.folders.map(folder => (
              <li key={folder._id} className="flex items-center justify-between p-2 border-b">
                <div>
                  <Link href={`/folder/${folder._id}`} className="font-medium text-indigo-700 hover:underline">
                    {folder.name}
                  </Link>
                  <span className="ml-2 text-sm text-gray-500">
                    by {folder.creatorUsername}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteFolder(folder._id, folder.name)}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                  Delete
                </button>
              </li>
            ))}
          </DataList>

          {/* Image List */}
          <DataList title={`All Images (${stats.imageCount})`}>
            {stats.images.map(image => (
              <li key={image._id} className="flex items-center justify-between p-2 border-b">
                <div>
                  <a href={image.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 hover:underline truncate" style={{maxWidth: '200px'}}>
                    {image.filename}
                  </a>
                  <span className="ml-2 text-sm text-gray-500">
                    by {image.uploaderUsername}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteImage(image._id, image.folderId)}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                  Delete
                </button>
              </li>
            ))}
          </DataList>

          {/* Code List */}
          <DataList title={`All Code Snippets (${stats.codeCount})`}>
            {stats.codes.map(code => (
              <li key={code._id} className="flex items-center justify-between p-2 border-b">
                <div>
                  <a href={`/api/code/${code._id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 hover:underline">
                    {code.filename}
                  </a>
                  <span className="ml-2 text-sm text-gray-500">
                    by {code.uploaderUsername}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteCode(code._id)}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                  Delete
                </button>
              </li>
            ))}
          </DataList>

        </div>

      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <p className="text-xl text-gray-800">Loading...</p>
    </div>
  );
}

// Helper component for Stat Cards
function StatCard({ title, value }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

// Helper component for Data Lists
function DataList({ title, children }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-indigo-800">
        {title}
      </h2>
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {children}
      </ul>
    </div>
  );
}