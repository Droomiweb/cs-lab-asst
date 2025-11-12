'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function ImageUploader({ folderId, onUploadComplete }) {
  const [uploadingFiles, setUploadingFiles] = useState([]); // To track progress
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    if (acceptedFiles.length === 0) {
      return;
    }

    // Set initial uploading state
    const filesWithStatus = acceptedFiles.map(file => ({
      name: file.name,
      status: 'uploading', // 'uploading', 'success', 'error'
    }));
    setUploadingFiles(filesWithStatus);

    // Start all uploads
    acceptedFiles.forEach(async (file, index) => {
      try {
        // We send the file to our API route
        // We add folderId and filename to the URL as search params
        const res = await fetch(
          `/api/upload?folderId=${folderId}&filename=${encodeURIComponent(file.name)}`,
          {
            method: 'POST',
            body: file, // The file body
          }
        );

        if (!res.ok) {
          throw new Error('Upload failed.');
        }

        // Update status for this file
        setUploadingFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'success' } : f
        ));

        // Tell the parent page to refresh its list of images
        onUploadComplete(); 

      } catch (err) {
        // Update status for this file
        setUploadingFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'error' } : f
        ));
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    });

  }, [folderId, onUploadComplete]);

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  });

  return (
    <div className="p-4 mt-6 border-2 border-dashed rounded-lg border-sky-400 bg-sky-50">
      <div
        {...getRootProps()}
        className={`flex items-center justify-center p-10 text-center cursor-pointer ${
          isDragActive ? 'bg-sky-100' : ''
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-xl font-semibold text-sky-700">Drop files here!</p>
        ) : (
          <p className="text-lg text-gray-600">
            Drag & drop images here, or click to select files.
          </p>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Uploading Animations / Status */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-gray-700">Uploads:</h4>
          {uploadingFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
              <span className="text-sm text-gray-800 truncate">{file.name}</span>
              {file.status === 'uploading' && (
                <div className="w-5 h-5 border-2 rounded-full border-sky-500 border-t-transparent animate-spin"></div>
              )}
              {file.status === 'success' && (
                <span className="text-green-500">✓ Done</span>
              )}
              {file.status === 'error' && (
                <span className="text-red-500">✗ Failed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}