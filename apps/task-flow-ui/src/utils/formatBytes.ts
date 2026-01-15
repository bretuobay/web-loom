const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return '0 B';
  }
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(1).replace(/\.0$/, '')} ${UNITS[index]}`;
}
