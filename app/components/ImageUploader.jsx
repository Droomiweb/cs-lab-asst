'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

/**
 * ImageUploader
 * - Drag & drop or click to select images
 * - Uploads to `/api/folder/:folderId/images` via FormData POST
 * - Shows per-file status (uploading, success, error)
 * - Calls onUploadComplete() after each successful upload (parent can decide what to do)
 *
 * Props:
 * - folderId (string)
 * - onUploadComplete (function)
 */
export default function ImageUploader({ folderId, onUploadComplete }) {
  const [uploadingFiles, setUploadingFiles] = useState([]); // [{ id, name, status }]
  const [error, setError] = useState(null);

  const uploadFile = async (file, fileId) => {
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'uploading' } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/folder/${folderId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Upload failed');
      }

      // success
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: 'success' } : f))
      );

      if (typeof onUploadComplete === 'function') {
        try {
          onUploadComplete();
        } catch (e) {
          // ignore parent callback errors
        }
      }
    } catch (err) {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: 'error' } : f))
      );
      setError(err.message || 'Upload failed');
    }
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      setError(null);
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const maxFiles = 10;
      const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

      const validFiles = acceptedFiles.slice(0, maxFiles);
      const tooLarge = validFiles.find((f) => f.size > maxSizeBytes);
      if (tooLarge) {
        setError(`File "${tooLarge.name}" is too large. Max 10MB per file.`);
        return;
      }

      // Create tracked entries with unique IDs
      const entries = validFiles.map((f) => ({ id: uuidv4(), name: f.name, status: 'queued', file: f }));
      setUploadingFiles((prev) => [...prev, ...entries.map(({ id, name }) => ({ id, name, status: 'queued' }))]);

      // Start uploads (concurrent)
      entries.forEach((entry) => {
        uploadFile(entry.file, entry.id);
      });
    },
    // folderId and onUploadComplete intentionally not in deps for stable callback — they are used inside uploadFile which reads the values via closure.
    []
  );

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  });

  return (
    <div className="p-4 mt-6 border-2 border-dashed rounded-lg border-indigo-400 bg-indigo-50">
      <div
        {...getRootProps()}
        className={`flex items-center justify-center p-10 text-center cursor-pointer ${
          isDragActive ? 'bg-indigo-100' : ''
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-xl font-semibold text-indigo-700">Drop files here!</p>
        ) : (
          <p className="text-lg text-gray-600">Drag & drop images here, or click to select files.</p>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-gray-700">Uploads:</h4>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
              <span className="text-sm text-gray-800 truncate">{file.name}</span>

              {file.status === 'uploading' && (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 rounded-full border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-sm text-indigo-600">Uploading...</span>
                </div>
              )}

              {file.status === 'queued' && <span className="text-sm text-gray-500">Queued</span>}
              {file.status === 'success' && <span className="text-green-500">✓ Done</span>}
              {file.status === 'error' && <span className="text-red-500">✗ Failed</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
