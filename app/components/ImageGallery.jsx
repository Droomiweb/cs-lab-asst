'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react'; // Import useState

/**
 * ImageGallery
 * Props:
 * - images: array of image objects (expects _id, url, filename, uploadedBy, uploaderUsername, folderId)
 * - onImageDeleted: function(imageId) -> parent should remove image locally
 */
export default function ImageGallery({ images, onImageDeleted }) {
  const { data: session } = useSession();
  const [copiedId, setCopiedId] = useState(null); // State for copy message

  // Delete handler (uses folderId from first image as fallback)
  const handleDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      if (!images?.[0]?.folderId) {
        alert('Error: Could not determine folder ID.');
        return;
      }
      const folderId = images[0].folderId;

      const res = await fetch(`/api/folder/${folderId}/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // notify parent to remove locally
        if (typeof onImageDeleted === 'function') onImageDeleted(imageId);
      } else {
        alert(`Error: ${data.message || 'Failed to delete image.'}`);
      }
    } catch (err) {
      alert(`An error occurred: ${err.message}`);
    }
  };

  // Download handler
  const handleDownload = (url, filename) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      })
      .catch((err) => console.error('Download failed', err));
  };

  // --- ADDED SHARE HANDLER ---
  const handleShareImage = (url, imageId) => {
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!images || images.length === 0) {
    return (
      <div className="p-10 mt-6 text-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No images have been uploaded to this folder yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mt-6 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <div key={image._id} className="relative overflow-hidden bg-white rounded-lg shadow-md group">
          <img
            src={image.url}
            alt={image.filename}
            className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-opacity duration-300 opacity-0 bg-black bg-opacity-60 group-hover:opacity-100">
            <p className="text-sm font-semibold truncate">{image.filename}</p>
            <p className="text-xs text-gray-200 truncate">By: {image.uploaderUsername}</p>

            <div className="flex items-center justify-between mt-2">
              {/* --- NEW SHARE BUTTON --- */}
              <button
                onClick={() => handleShareImage(image.url, image._id)}
                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                {copiedId === image._id ? 'Copied!' : 'Share'}
              </button>

              {/* Download Button (indigo theme) */}
              <button
                onClick={() => handleDownload(image.url, image.filename)}
                className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Download
              </button>

              {/* Delete Button (visible only to uploader) */}
              {session?.user?.id === image.uploadedBy && (
                <button
                  onClick={() => handleDelete(image._id)}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}