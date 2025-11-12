'use client';

import { useSession } from 'next-auth/react';

export default function ImageGallery({ images, onImageDeleted }) {
  const { data: session } = useSession();

  // Handle image deletion
  const handleDelete = async (imageId, imageUrl) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        // Tell the parent page to remove this image from the list
        onImageDeleted(imageId);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(`An error occurred: ${err.message}`);
    }
  };

  // Handle download
  const handleDownload = (url, filename) => {
    // We use fetch to get the blob, then create a local URL to trigger download
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(err => console.error('Download failed', err));
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
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-opacity duration-300 opacity-0 bg-black bg-opacity-60 group-hover:opacity-100">
            <p className="text-sm truncate">{image.filename}</p>
            <div className="flex items-center justify-between mt-2">
              {/* Download Button */}
              <button
                onClick={() => handleDownload(image.url, image.filename)}
                className="px-2 py-1 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
              >
                Download
              </button>

              {/* Delete Button (Conditional) */}
              {session?.user.id === image.uploadedBy && (
                <button
                  onClick={() => handleDelete(image._id, image.url)}
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