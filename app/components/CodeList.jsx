'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

// Accepts: codes (array), onCodeDeleted (function)
export default function CodeList({ codes, onCodeDeleted }) {
  const { data: session } = useSession();
  const [copiedId, setCopiedId] = useState(null);
  const [copiedUrlId, setCopiedUrlId] = useState(null); // --- ADDED ---

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code.content || '');
      setCopiedId(code._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard.');
    }
  };

  // --- ADDED SHARE LINK HANDLER ---
  const handleShareLink = (codeId) => {
    // Construct the absolute URL to the API endpoint
    const url = `${window.location.origin}/api/code/${codeId}`;
    navigator.clipboard.writeText(url);
    setCopiedUrlId(codeId);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const handleDelete = async (codeId) => {
    if (!confirm('Are you sure you want to delete this code snippet?')) return;

    try {
      const res = await fetch(`/api/code/${codeId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Inform parent to remove locally
        if (typeof onCodeDeleted === 'function') {
          onCodeDeleted(codeId);
        }
      } else {
        alert(`Error: ${data.message || 'Failed to delete.'}`);
      }
    } catch (err) {
      alert(`An error occurred: ${err.message}`);
    }
  };

  if (!codes || codes.length === 0) {
    return (
      <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No code snippets have been saved to this folder yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {codes.map((code) => (
        <div
          key={code._id}
          className="flex flex-col p-4 bg-white rounded-lg shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          {/* File Info */}
          <div className="flex-1 mb-3 sm:mb-0">
            <a
              href={`/api/code/${code._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
              title="Click to open raw file in new tab"
            >
              {code.filename}
            </a>
            <p className="text-sm text-gray-500">
              Saved by {code.uploaderUsername} on {new Date(code.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-shrink-0 space-x-2">
            {/* Copy Button */}
            <button
              onClick={() => handleCopy(code)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 w-28"
            >
              {copiedId === code._id ? 'Copied!' : 'Copy Code'}
            </button>

            {/* --- ADDED SHARE LINK BUTTON --- */}
            <button
              onClick={() => handleShareLink(code._id)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 w-28"
            >
              {copiedUrlId === code._id ? 'Copied!' : 'Share Link'}
            </button>
            
            {/* Download Button */}
            <a
              href={`/api/code/${code._id}`}
              download={code.filename}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Download
            </a>

            {/* Delete Button (only for uploader or admin) */}
            {(session?.user?.id === code.uploadedBy || session?.user?.role === 'admin') && (
              <button
                onClick={() => handleDelete(code._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}