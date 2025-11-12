'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Import all our components
import ImageUploader from '../../components/ImageUploader';
import ImageGallery from '../../components/ImageGallery';
import CodeUploader from '../../components/CodeUploader';
import CodeList from '../../components/CodeList';

export default function FolderPage() {
  const params = useParams();
  const { folderId } = params;
  const { data: session } = useSession();

  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- State for Images ---
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // --- State for Codes ---
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // --- State for toggling views ---
  const [view, setView] = useState('images'); // 'images' or 'codes'

  // --- 1. Fetch Folder Data (Password Check) ---
  const fetchFolderData = async () => {
    if (!folderId) return;
    try {
      const res = await fetch(`/api/folder/${folderId}`);
      if (!res.ok) throw new Error('Folder not found');
      const data = await res.json();
      setFolder(data.folder);
      if (!data.folder.isPasswordProtected) {
        setIsVerified(true); // Auto-verify if no password
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Fetch Images (if verified) ---
  const fetchImages = async () => {
    if (!folderId) return;
    setLoadingImages(true);
    try {
      const res = await fetch(`/api/folder/${folderId}/images`);
      if (!res.ok) throw new Error('Could not fetch images');
      const data = await res.json();
      setImages(data.images);
    } catch (err) {
      console.error(err.message); // Log error but don't block UI
    } finally {
      setLoadingImages(false);
    }
  };

  // --- 3. Fetch Codes (if verified) ---
  const fetchCodes = async () => {
    if (!folderId) return;
    setLoadingCodes(true);
    try {
      const res = await fetch(`/api/folder/${folderId}/codes`);
      if (!res.ok) throw new Error('Could not fetch codes');
      const data = await res.json();
      setCodes(data.codes);
    } catch (err) {
      console.error(err.message); // Log error but don't block UI
    } finally {
      setLoadingCodes(false);
    }
  };

  // Run folder data fetch on load
  useEffect(() => {
    fetchFolderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  // Run content fetches ONLY when verified
  useEffect(() => {
    if (isVerified) {
      fetchImages();
      fetchCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified, folderId]); // Re-run if isVerified changes

  // --- 4. Handle Password Submission ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/folder/${folderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true); // Grant access!
      } else {
        setError(data.message || 'Incorrect password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // --- 5. Handler for Image Deletion ---
  const handleImageDeleted = (imageId) => {
    setImages((prev) => prev.filter((img) => img._id !== imageId));
  };

  // --- 6. Handler for Code Deletion ---
  const handleCodeDeleted = (codeId) => {
    setCodes((prev) => prev.filter((c) => c._id !== codeId));
  };

  // (We'll use fetchCodes as the onUploadComplete for the code uploader)

  // --- 7. Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-sky-800">Loading folder...</p>
      </div>
    );
  }

  if (error && !isVerified) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  // --- RENDER FOLDER CONTENTS (If verified) ---
  if (isVerified && folder) {
    return (
      <div className="container p-4 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-sky-900">{folder.name}</h1>
        <p className="mt-2 text-lg text-gray-600">{folder.description}</p>

        <div className="mt-8 border-t border-gray-200 pt-6">
          {/* --- TABS for Images/Codes --- */}
          <div className="flex mt-4 space-x-4">
            <button
              onClick={() => setView('images')}
              className={`px-6 py-3 font-semibold rounded-md shadow-md ${
                view === 'images'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-sky-700 hover:bg-sky-50'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setView('codes')}
              className={`px-6 py-3 font-semibold rounded-md shadow-md ${
                view === 'codes'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-sky-700 hover:bg-sky-50'
              }`}
            >
              Codes
            </button>
          </div>

          {/* --- Image Section --- */}
          {view === 'images' && (
            <div id="image-section">
              {session && (
                <ImageUploader
                  folderId={folderId}
                  onUploadComplete={fetchImages}
                />
              )}
              {loadingImages ? (
                <p className="mt-6">Loading images...</p>
              ) : (
                <ImageGallery
                  images={images}
                  onImageDeleted={handleImageDeleted}
                />
              )}
            </div>
          )}

          {/* --- Code Section --- */}
          {view === 'codes' && (
            <div id="code-section">
              {session && (
                <CodeUploader
                  folderId={folderId}
                  onUploadComplete={fetchCodes}
                />
              )}
              {loadingCodes ? (
                <p className="mt-6">Loading code snippets...</p>
              ) : (
                <CodeList
                  codes={codes}
                  onCodeDeleted={handleCodeDeleted} // <-- PASS THE NEW HANDLER
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER PASSWORD PROMPT (If not verified) ---
  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-sky-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center text-sky-800">
            🔒 This folder is protected
          </h1>
          <p className="text-center text-gray-600">
            Please enter the password to access: <span className="font-semibold">{folder?.name}</span>
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Unlock
              </button>
            </div>
            {error && (
              <p className="text-sm text-center text-red-500">{error}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't usually reach here)
  return null;
}
