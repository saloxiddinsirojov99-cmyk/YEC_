import { existsSync } from 'fs';
import { isAbsolute, join, resolve } from 'path';

const toAbsolutePath = (value: string): string => {
  if (!value.trim()) return value;
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
};

const unique = (items: string[]): string[] => Array.from(new Set(items));

export const getUploadPathCandidates = (): string[] => {
  const envDir = process.env.UPLOADS_DIR?.trim();
  const envPath = envDir ? toAbsolutePath(envDir) : '';

  return unique(
    [
      envPath,
      join(process.cwd(), 'backend', 'uploads'),
      join(process.cwd(), 'uploads'),
      join(__dirname, '..', '..', '..', 'uploads'),
      join(__dirname, '..', '..', 'uploads'),
    ].filter(Boolean),
  );
};

export const resolveUploadsDir = (): string => {
  // On Vercel serverless functions, the root filesystem is read-only.
  // /tmp is the only writable directory (ephemeral fallback).
  if (process.env.VERCEL && !process.env.UPLOADS_DIR) {
    return join('/tmp', 'uploads');
  }

  const candidates = getUploadPathCandidates();
  return (
    candidates.find((candidate) => existsSync(candidate)) ??
    candidates[0] ??
    join(process.cwd(), 'uploads')
  );
};
