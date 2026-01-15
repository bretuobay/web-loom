import { BehaviorSubject } from 'rxjs';
import type { ICommentRepository } from '../domain/repositories/interfaces';
import { ApiCommentRepository } from '../domain/repositories/ApiCommentRepository';
import type { CommentEntity } from '../domain/entities/comment';

export class TaskCommentsViewModel {
  private readonly repository: ICommentRepository;
  private readonly comments$ = new BehaviorSubject<CommentEntity[]>([]);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  public readonly commentsObservable = this.comments$.asObservable();
  public readonly isLoading$ = this.loading$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();

  constructor(repository?: ICommentRepository) {
    this.repository = repository ?? new ApiCommentRepository();
  }

  async load(taskId: string) {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const comments = await this.repository.fetchForTask(taskId);
      this.comments$.next(comments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load comments';
      this.error$.next(message);
    } finally {
      this.loading$.next(false);
    }
  }

  async addComment(taskId: string, content: string) {
    if (!content.trim()) {
      return;
    }
    this.loading$.next(true);
    this.error$.next(null);
    try {
      await this.repository.create(taskId, content);
      await this.load(taskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      this.error$.next(message);
    } finally {
      this.loading$.next(false);
    }
  }
}
