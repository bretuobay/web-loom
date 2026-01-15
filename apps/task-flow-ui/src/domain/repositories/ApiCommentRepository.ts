import { CommentEntity } from '../entities/comment';
import type { CommentApiResponse } from '../entities/comment';
import { taskFlowApiClient } from '../services/apiClient';
import type { ICommentRepository } from './interfaces';

export class ApiCommentRepository implements ICommentRepository {
  private client;

  constructor(client = taskFlowApiClient) {
    this.client = client;
  }

  async fetchForTask(taskId: string) {
    const response = await this.client.fetchComments(taskId);
    return response.map((comment: CommentApiResponse) => CommentEntity.fromApi(comment));
  }

  async create(taskId: string, content: string) {
    const response = await this.client.createComment({ taskId, content });
    return CommentEntity.fromApi(response);
  }
}
