import { BehaviorSubject, combineLatest, type Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Command } from '@web-loom/mvvm-core';
import type { ICommentRepository } from '../domain/repositories/interfaces';
import { ApiCommentRepository } from '../domain/repositories/ApiCommentRepository';
import type { CommentEntity } from '../domain/entities/comment';

type CreateCommentPayload = { taskId: string; content: string };

export class TaskCommentsViewModel {
  private readonly repository: ICommentRepository;
  private readonly comments$ = new BehaviorSubject<CommentEntity[]>([]);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  public readonly commentsObservable = this.comments$.asObservable();
  public readonly errorMessage$ = this.error$.asObservable();

  public readonly fetchCommand: Command<string, void>;
  public readonly createCommand: Command<CreateCommentPayload, void>;
  public readonly isLoading$: Observable<boolean>;

  constructor(repository?: ICommentRepository) {
    this.repository = repository ?? new ApiCommentRepository();

    this.fetchCommand = new Command(async (taskId: string) => {
      if (!taskId) {
        throw new Error('Task ID is required to load comments.');
      }
      this.clearError();
      try {
        const comments = await this.repository.fetchForTask(taskId);
        this.comments$.next(comments);
      } catch (error) {
        this.updateError(error, 'Failed to load comments');
        throw error;
      }
    });

    this.createCommand = new Command(async ({ taskId, content }: CreateCommentPayload) => {
      if (!taskId) {
        throw new Error('Task ID is required to add a comment.');
      }
      if (!content.trim()) {
        return;
      }
      this.clearError();
      try {
        await this.repository.create(taskId, content);
        await this.fetchCommand.execute(taskId);
      } catch (error) {
        this.updateError(error, 'Failed to add comment');
        throw error;
      }
    });

    this.isLoading$ = combineLatest([this.fetchCommand.isExecuting$, this.createCommand.isExecuting$]).pipe(
      map(([isFetching, isCreating]) => isFetching || isCreating),
      startWith(false),
    );
  }

  async load(taskId: string) {
    await this.fetchCommand.execute(taskId);
  }

  async addComment(taskId: string, content: string) {
    await this.createCommand.execute({ taskId, content });
  }

  dispose() {
    this.fetchCommand.dispose();
    this.createCommand.dispose();
    this.comments$.complete();
    this.error$.complete();
  }

  private updateError(error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    this.error$.next(message);
  }

  private clearError() {
    this.error$.next(null);
  }
}
