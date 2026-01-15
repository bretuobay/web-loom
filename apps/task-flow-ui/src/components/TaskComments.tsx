import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { TaskCommentsViewModel } from '../view-models/TaskCommentsViewModel';
import { useObservable } from '../hooks/useObservable';
import styles from './TaskComments.module.css';

interface TaskCommentsProps {
  taskId: string;
  viewModel?: TaskCommentsViewModel;
}

export function TaskComments({ taskId, viewModel }: TaskCommentsProps) {
  const vm = useMemo(() => viewModel ?? new TaskCommentsViewModel(), [viewModel]);
  const comments = useObservable(vm.commentsObservable, []);
  const isLoading = useObservable(vm.isLoading$, false);
  const errorMessage = useObservable(vm.errorMessage$, null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (taskId) {
      void vm.load(taskId).catch(() => {
        /* error handled by view model */
      });
    }
  }, [taskId, vm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await vm.addComment(taskId, draft);
      setDraft('');
    } catch {
      // View model already published the text error via the observable
    }
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h5>Comments</h5>
        <span className={styles.count}>{comments.length}</span>
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Share context, questions, or updates…"
          aria-label="New comment"
        />
        <button type="submit" disabled={isLoading || !draft.trim()}>
          {isLoading ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      <div className={styles.list}>
        {comments.map((comment) => (
          <article key={comment.id} className={styles.comment}>
            <header className={styles.commentHeader}>
              <span className={styles.author}>{comment.author.displayName}</span>
              <time dateTime={comment.createdAt.toISOString()}>{comment.relativeTime}</time>
            </header>
            <p className={styles.commentBody}>{comment.content}</p>
          </article>
        ))}
        {!comments.length && !isLoading && <p className={styles.empty}>No comments yet.</p>}
      </div>
    </section>
  );
}
