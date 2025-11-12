'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session } = useSession();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Form State ---
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // --- MODIFIED: Added error state for deletion ---
  const [deleteError, setDeleteError] = useState('');


  // --- Fetch all folders when component loads ---
  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (res.ok) {
        setFolders(data.folders);
      }
    } catch (err) {
      console.error('Failed to fetch folders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []); // Empty array means run once on mount

  // --- Handle Create Folder Form Submission ---
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDeleteError(''); // Clear delete error

    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        description: description,
        password: isPasswordEnabled ? password : null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('Folder created successfully!');
      // Reset form
      setFolderName('');
      setDescription('');
      setPassword('');
      setIsPasswordEnabled(false);
      setShowCreateForm(false);
      // Add new folder to the top of the list
      setFolders([data.folder, ...folders]);
    } else {
      setError(data.message || 'Failed to create folder.');
    }
  };

  // --- MODIFIED: Added Delete Folder Handler ---
  const handleDeleteFolder = async (e, folderId) => {
    e.preventDefault(); // Stop Link navigation
    e.stopPropagation(); // Stop Link navigation
    
    setDeleteError(''); // Clear old errors
    if (!confirm('Are you sure you want to delete this folder and ALL its contents? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/folder/${folderId}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Remove folder from local state
        setFolders(folders.filter(f => f._id !== folderId));
      } else {
        throw new Error(data.message || 'Failed to delete folder.');
      }
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <div className="container p-4 mx-auto max-w-7xl">
      
      {/* --- Create Folder Button & Form (Modal-like) --- */}
      <div className="my-6">
        {session && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-md hover:bg-indigo-700"
          >
            + Create New Folder
          </button>
        )}

        {showCreateForm && (
          <div className="p-6 my-4 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-indigo-800">
              New Folder
            </h2>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              {/* Folder Name */}
              <div>
                <label htmlFor="folderName" className="block text-sm font-medium text-gray-700">Folder Name</label>
                <input
                  type="text" id="folderName" required
                  value={folderName} onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description" rows="3"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Security Password Toggle */}
              <div className="flex items-center">
                <input
                  id="enablePassword" type="checkbox"
                  checked={isPasswordEnabled}
                  onChange={(e) => setIsPasswordEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="enablePassword" className="ml-2 block text-sm font-medium text-gray-700">
                  Enable Security Password
                </label>
              </div>

              {/* Password Input (Conditional) */}
              {isPasswordEnabled && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password" id="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-green-500">{message}</p>}
            </form>
          </div>
        )}
      </div>

      {/* --- Folders List --- */}
      <h1 className="pb-4 mb-6 text-3xl font-bold border-b border-gray-300 text-indigo-900">
        All Folders
      </h1>

      {/* --- MODIFIED: Added delete error display --- */}
      {deleteError && (
        <div className="p-4 mb-4 text-red-800 bg-red-100 border border-red-300 rounded-md">
          <p>Error: {deleteError}</p>
        </div>
      )}

      {loading ? (
        <p>Loading folders...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Link 
              href={`/folder/${folder._id}`} 
              key={folder._id}
              className="relative block p-5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-indigo-800">
                  {folder.name}
                </h3>
                {folder.password && (
                  <span className="text-gray-500">
                    🔒
                  </span>
                )}
              </div>
              <p className="mb-4 text-gray-600 min-h-[3em]">
                {folder.description || 'No description.'}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Created by: <span className="font-medium">{folder.creatorUsername}</span>
                </span>
                
                {/* --- MODIFIED: Added Delete Button --- */}
                {session?.user?.id === folder.createdBy && (
                  <button
                    onClick={(e) => handleDeleteFolder(e, folder._id)}
                    className="z-10 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}