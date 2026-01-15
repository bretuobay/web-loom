import { UserEntity, type UserApiResponse } from './user';

export interface CommentApiResponse {
  id: string;
  content: string;
  taskId: string;
  author: UserApiResponse;
  createdAt: string;
  updatedAt: string;
}

export class CommentEntity {
  readonly id: string;
  readonly content: string;
  readonly taskId: string;
  readonly author: UserEntity;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    content: string,
    taskId: string,
    author: UserEntity,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.content = content;
    this.taskId = taskId;
    this.author = author;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApi(payload: CommentApiResponse) {
    return new CommentEntity(
      payload.id,
      payload.content,
      payload.taskId,
      UserEntity.fromApi(payload.author),
      new Date(payload.createdAt),
      new Date(payload.updatedAt)
    );
  }

  get relativeTime() {
    return this.createdAt.toLocaleString();
  }
}
