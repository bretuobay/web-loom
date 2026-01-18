import type { AttachmentEntity } from '../domain/entities/attachment';
import { formatBytes } from '../utils/formatBytes';
import styles from './TaskAttachments.module.css';

interface TaskAttachmentsProps {
  attachments: AttachmentEntity[];
}

export function TaskAttachments({ attachments }: TaskAttachmentsProps) {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>Attachments</p>
          <p className={styles.subtitle}>
            {attachments.length} file{attachments.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {attachments.length ? (
        <div className={styles.list}>
          {attachments.map((attachment) => (
            <AttachmentPreview key={attachment.id} attachment={attachment} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No files yet. Drop one below or tap to upload.</p>
      )}
    </section>
  );
}

function AttachmentPreview({ attachment }: { attachment: AttachmentEntity }) {
  const label = attachment.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE';

  return (
    <a className={styles.attachment} href={attachment.downloadUrl} target="_blank" rel="noreferrer">
      {attachment.isImage ? (
        <img src={attachment.downloadUrl} alt={attachment.originalName} className={styles.thumbnail} />
      ) : (
        <div className={styles.icon} aria-hidden="true">
          {label}
        </div>
      )}
      <div className={styles.meta}>
        <span className={styles.name}>{attachment.originalName}</span>
        <span className={styles.size}>{formatBytes(attachment.size)}</span>
      </div>
    </a>
  );
}
