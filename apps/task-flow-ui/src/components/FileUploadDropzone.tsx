import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { formatBytes } from '../utils/formatBytes';
import styles from './FileUploadDropzone.module.css';

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface FileUploadDropzoneProps {
  onFileSelected: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function FileUploadDropzone({ onFileSelected, disabled = false }: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      return `Files must be smaller than ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return 'Only PNG, JPEG, PDF, DOCX, XLSX, and ZIP files are allowed.';
    }

    return null;
  };

  const handleFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) {
      return;
    }

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    setFeedback(null);
    setIsUploading(true);
    try {
      await onFileSelected(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload file.';
      setFeedback(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current += 1;
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const startBrowse = () => {
    if (disabled || isUploading) {
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={startBrowse}
      aria-disabled={disabled || isUploading}
    >
      <input ref={inputRef} type="file" className={styles.input} onChange={handleInputChange} disabled={disabled} />
      <p className={styles.primaryText}>
        {isUploading ? 'Uploading attachment…' : 'Drag a file here or click to upload'}
      </p>
      <p className={styles.secondaryText}>Allowed: PNG · JPEG · WEBP · GIF · PDF · DOCX · XLSX · ZIP · TXT</p>
      <p className={styles.secondaryText}>Max size: {formatBytes(MAX_UPLOAD_BYTES)}</p>
      {feedback && (
        <p role="status" className={styles.feedback}>
          {feedback}
        </p>
      )}
    </div>
  );
}
