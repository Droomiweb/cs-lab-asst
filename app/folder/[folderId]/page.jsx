'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
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

  // --- State for Add Content Modal ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalView, setAddModalView] = useState('options'); // 'options', 'image', 'code'

  // --- State for Search ---
  const [searchQuery, setSearchQuery] = useState('');

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
      setImages(data.images || []);
    } catch (err) {
      console.error(err.message);
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
      setCodes(data.codes || []);
    } catch (err) {
      console.error(err.message);
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
  }, [isVerified, folderId]);

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
        setIsVerified(true);
      } else {
        setError(data.message || 'Incorrect password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // --- 5. Handler for Image Deletion ---
  const handleImageDeleted = (imageId) => {
    // optimistic local update
    setImages((prev) => prev.filter((img) => img._id !== imageId));
  };

  // --- 6. Handler for Code Deletion ---
  const handleCodeDeleted = (codeId) => {
    // optimistic local update
    setCodes((prev) => prev.filter((c) => c._id !== codeId));
  };

  // --- Handlers for Add Content Modal ---
  const openAddModal = () => {
    setAddModalView('options');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // --- Filtered lists based on search query (memoized) ---
  const filteredImages = useMemo(() => {
    if (!searchQuery) return images;
    return images.filter((image) =>
      (image.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  const filteredCodes = useMemo(() => {
    if (!searchQuery) return codes;
    return codes.filter((code) =>
      (code.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [codes, searchQuery]);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-indigo-800">Loading folder...</p>
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
      <div className="container p-4 mx-auto max-w-7xl pb-24">
        {/* Modified: indigo theme */}
        <h1 className="text-3xl font-bold text-indigo-900">{folder.name}</h1>
        <p className="mt-2 text-lg text-gray-600">{folder.description}</p>

        <div className="mt-8 border-t border-gray-200 pt-6">
          {/* TABS for Images/Codes */}
          <div className="flex mt-4 space-x-4">
            <button
              onClick={() => setView('images')}
              className={`px-6 py-3 font-semibold rounded-md shadow-md ${
                view === 'images'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setView('codes')}
              className={`px-6 py-3 font-semibold rounded-md shadow-md ${
                view === 'codes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              Codes
            </button>
          </div>

          {/* Search Bar */}
          <div className="my-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Image Section */}
          {view === 'images' && (
            <div id="image-section">
              {/* Inline uploader (optional), and also available in modal */}
              {session && (
                <div className="mb-4">
                  <ImageUploader
                    folderId={folderId}
                    onUploadComplete={fetchImages}
                  />
                </div>
              )}

              {loadingImages ? (
                <p className="mt-6">Loading images...</p>
              ) : (
                <>
                  {filteredImages.length > 0 && (
                    <ImageGallery
                      images={filteredImages}
                      onImageDeleted={handleImageDeleted}
                    />
                  )}

                  {images.length === 0 && (
                    <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
                      <p className="text-gray-500">
                        No images have been uploaded to this folder yet.
                      </p>
                    </div>
                  )}

                  {images.length > 0 && filteredImages.length === 0 && (
                    <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
                      <p className="text-gray-500">
                        No images found matching &quot;{searchQuery}&quot;.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Code Section */}
          {view === 'codes' && (
            <div id="code-section">
              {/* Inline code uploader (optional) */}
              {session && (
                <div className="mb-4">
                  <CodeUploader
                    folderId={folderId}
                    onUploadComplete={fetchCodes}
                  />
                </div>
              )}

              {loadingCodes ? (
                <p className="mt-6">Loading code snippets...</p>
              ) : (
                <>
                  {filteredCodes.length > 0 && (
                    <CodeList
                      codes={filteredCodes}
                      onCodeDeleted={handleCodeDeleted}
                    />
                  )}

                  {codes.length === 0 && (
                    <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
                      <p className="text-gray-500">
                        No code snippets have been saved to this folder yet.
                      </p>
                    </div>
                  )}

                  {codes.length > 0 && filteredCodes.length === 0 && (
                    <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
                      <p className="text-gray-500">
                        No code snippets found matching &quot;{searchQuery}&quot;.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        {session && (
          <button
            onClick={openAddModal}
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110"
            title="Add new file"
          >
            <span className="text-4xl font-light">+</span>
          </button>
        )}

        {/* Add Content Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
            <div
              className="absolute inset-0 bg-black bg-opacity-70"
              onClick={closeAddModal}
            ></div>

            <div className="relative z-[70] w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 transition-all duration-300">
              {addModalView === 'options' && (
                <div>
                  <h2 className="text-2xl font-semibold text-indigo-800 mb-6">
                    What would you like to add?
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setAddModalView('image')}
                      className="p-6 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-center"
                    >
                      <span className="text-3xl">🖼️</span>
                      <p className="mt-2 text-lg font-semibold">Upload Images</p>
                    </button>
                    <button
                      onClick={() => setAddModalView('code')}
                      className="p-6 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center"
                    >
                      <span className="text-3xl">💻</span>
                      <p className="mt-2 text-lg font-semibold">Save Code Snippet</p>
                    </button>
                  </div>
                  <button
                    onClick={closeAddModal}
                    className="mt-6 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {addModalView === 'image' && (
                <div>
                  <button
                    onClick={() => setAddModalView('options')}
                    className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    &larr; Back
                  </button>
                  <ImageUploader
                    folderId={folderId}
                    onUploadComplete={() => {
                      fetchImages();
                      closeAddModal();
                    }}
                  />
                </div>
              )}

              {addModalView === 'code' && (
                <div>
                  <button
                    onClick={() => setAddModalView('options')}
                    className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    &larr; Back
                  </button>
                  <CodeUploader
                    folderId={folderId}
                    onUploadComplete={() => {
                      fetchCodes();
                      closeAddModal();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER PASSWORD PROMPT (If not verified) ---
  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center text-indigo-800">
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
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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

  // Fallback
  return null;
}
