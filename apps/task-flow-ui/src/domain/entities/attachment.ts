export interface AttachmentApiResponse {
  id: string;
  taskId: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export class AttachmentEntity {
  readonly id: string;
  readonly taskId: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly downloadUrl: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    taskId: string,
    originalName: string,
    mimeType: string,
    size: number,
    downloadUrl: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.taskId = taskId;
    this.originalName = originalName;
    this.mimeType = mimeType;
    this.size = size;
    this.downloadUrl = downloadUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApi(payload: AttachmentApiResponse) {
    const createdAt = new Date(payload.createdAt);
    const updatedAt = payload.updatedAt ? new Date(payload.updatedAt) : createdAt;

    return new AttachmentEntity(
      payload.id,
      payload.taskId,
      payload.originalName,
      payload.mimeType,
      payload.size,
      payload.downloadUrl,
      createdAt,
      updatedAt
    );
  }

  get isImage() {
    return this.mimeType.startsWith('image/');
  }
}
