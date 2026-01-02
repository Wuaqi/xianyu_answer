/**
 * 文件上传组件
 * 支持图片和文本文件的上传预览
 */

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File, content: string) => void;
  disabled?: boolean;
}

// 支持的文件类型
const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  text: ['text/plain', 'text/markdown', 'application/json'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidType = (type: string) => {
    return [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.text].includes(type);
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      setError('文件过大，最大支持 5MB');
      return;
    }

    // 检查文件类型
    if (!isValidType(file.type)) {
      setError('不支持的文件类型，仅支持图片和文本文件');
      return;
    }

    try {
      let content = '';

      if (ACCEPTED_TYPES.image.includes(file.type)) {
        // 图片转 base64
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        // 文本文件读取内容
        content = await file.text();
      }

      onFileSelect(file, content);
    } catch (err) {
      setError('文件读取失败');
      console.error('File read error:', err);
    }
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.text].join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          isDragging
            ? 'bg-blue-100 border-2 border-blue-400'
            : 'hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title="上传文件（图片/文本）"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      {error && (
        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-red-600 bg-red-50 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * 文件预览组件
 */
interface FilePreviewProps {
  file: File;
  content: string;
  onRemove: () => void;
}

export function FilePreview({ file, content, onRemove }: FilePreviewProps) {
  const isImage = ACCEPTED_TYPES.image.includes(file.type);

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
      {isImage ? (
        <img
          src={content}
          alt={file.name}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <div className="flex flex-col min-w-0">
        <span className="truncate max-w-[150px] font-medium">{file.name}</span>
        <span className="text-xs text-gray-500">
          {(file.size / 1024).toFixed(1)} KB
        </span>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 p-1 hover:bg-gray-200 rounded"
        title="移除文件"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
