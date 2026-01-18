import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import { Attachment } from '../models/attachment.model.js';
import { Task } from '../models/task.model.js';
import { ApiError } from '../middleware/httpErrors.js';

export interface AttachmentUploadPayload {
  taskId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

const generateStoredName = (originalName: string) => {
  const extension = path.extname(originalName);
  return `${randomUUID()}${extension}`;
};

const ensureUploadDirectory = () => fs.mkdir(config.app.uploadsPath, { recursive: true });

export const attachmentService = {
  async create(payload: AttachmentUploadPayload) {
    const task = await Task.findByPk(payload.taskId);
    if (!task) {
      throw new ApiError('Task not found', 404);
    }

    const storedName = generateStoredName(payload.originalName);
    const destination = path.join(config.app.uploadsPath, storedName);

    await ensureUploadDirectory();

    try {
      await fs.writeFile(destination, payload.buffer);
    } catch (error) {
      throw new ApiError('Failed to save attachment', 500);
    }

    let attachment;
    try {
      attachment = await Attachment.create({
        taskId: payload.taskId,
        originalName: payload.originalName,
        storedName,
        mimeType: payload.mimeType,
        size: payload.size,
      });
    } catch (error) {
      await fs.rm(destination).catch(() => {});
      throw error;
    }

    return attachment;
  },
};
