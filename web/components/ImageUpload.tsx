'use client';

import { useState, useRef } from 'react';
import { Upload, Link, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export default function ImageUpload({ value, onChange, placeholder }: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, GIF, or WebP');
      return;
    }

    // Validate file size (max 2MB to save Cloudinary credits)
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum 2MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'walko');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      // Use the secure URL from Cloudinary
      onChange(data.secure_url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const clearImage = () => {
    onChange('');
    setError('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
            mode === 'upload' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload size={12} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
            mode === 'url' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Link size={12} />
          URL
        </button>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Preview" 
            className="h-20 rounded-lg border border-gray-200 object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && !value && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={24} className="text-gray-400" />
              <div>
                <span className="text-sm text-blue-600 font-medium">Click to upload</span>
                <span className="text-sm text-gray-500"> or drag & drop</span>
              </div>
              <span className="text-xs text-gray-400">JPG, PNG, GIF, WebP (max 2MB)</span>
            </div>
          )}
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && !value && (
        <div className="flex gap-2">
          <input
            type="url"
            className="input text-sm flex-1"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder || "https://example.com/image.png"}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            Add
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
