'use client';

import { useState } from 'react';

export default function CodeUploader({ folderId, onUploadComplete }) {
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    if (!filename || !content) {
      setError('Filename and code content are required.');
      setIsSubmitting(false);
      return;
    }

    const lineCount = content.split('\n').length;
    if (lineCount > 600) {
      setError('Code snippet must be 600 lines or less.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content, folderId }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`File "${filename}" saved successfully!`);
        // Clear the form
        setFilename('');
        setContent('');
        // Tell the parent to refetch the list (if provided)
        if (typeof onUploadComplete === 'function') {
          try {
            onUploadComplete();
          } catch (err) {
            // ignore parent callback errors
            console.warn('onUploadComplete threw:', err);
          }
        }
      } else {
        setError(data.message || 'Failed to save snippet.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Green / neutral themed (matches modal button)
    <div className="p-6 mt-6 border-2 rounded-lg border-green-400 bg-green-50">
      <h3 className="mb-4 text-xl font-semibold text-green-800">
        Save a New Code Snippet
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Filename Input */}
        <div>
          <label
            htmlFor="filename"
            className="block text-sm font-medium text-gray-700"
          >
            Filename (e.g., <code>helpers.js</code>, <code>styles.css</code>)
          </label>
          <input
            id="filename"
            type="text"
            required
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Code Content Textarea */}
        <div>
          <label
            htmlFor="code-content"
            className="block text-sm font-medium text-gray-700"
          >
            Code Content (Max 600 lines)
          </label>
          <textarea
            id="code-content"
            rows="10"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 mt-1 font-mono text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Paste your code here..."
          />
          <p className="text-xs text-gray-500">Lines: {content.split('\n').length}</p>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
          >
            {isSubmitting ? 'Saving...' : 'Save Snippet'}
          </button>
        </div>

        {/* Status Messages */}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-500">{message}</p>}
      </form>
    </div>
  );
}
