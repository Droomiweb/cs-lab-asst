'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react'; // For "Copied!" message

// Accept the new onCodeDeleted prop
export default function CodeList({ codes, onCodeDeleted }) {
  const { data: session } = useSession();
  // State to track which button is clicked for "Copied!" message
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (code) => {
    // Use the browser's built-in clipboard API
    navigator.clipboard.writeText(code.content);
    setCopiedId(code._id);
    // Reset the "Copied!" message after 2 seconds
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDelete = async (codeId) => {
    if (!confirm('Are you sure you want to delete this code snippet?')) {
      return;
    }

    try {
      const res = await fetch(`/api/code/${codeId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        // Tell the parent page to remove this code from the list
        onCodeDeleted(codeId);
      } else {
        alert(`Error: ${data.message}`);
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
              href={`/api/code/${code._id}`} // Link directly to the raw file API
              target="_blank" // Open in a new tab
              rel="noopener noreferrer"
              className="text-lg font-semibold text-sky-700 hover:text-sky-900 hover:underline"
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

            {/* Download Button */}
            <a
              href={`/api/code/${code._id}`}
              download={code.filename} // This HTML attribute triggers a download
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
            >
              Download
            </a>

            {/* Delete Button (Conditional) */}
            {session?.user.id === code.uploadedBy && (
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