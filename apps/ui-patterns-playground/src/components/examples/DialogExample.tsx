import { useDialogBehavior } from '@web-loom/ui-core/react';
import './examples.css';

/**
 * Example component demonstrating the useDialogBehavior hook
 * Shows how to manage dialog open/close state with callbacks
 */
export function DialogExample() {
  const dialog = useDialogBehavior({
    id: 'example-dialog',
    onOpen: (content) => {
      console.log('Dialog opened with content:', content);
    },
    onClose: () => {
      console.log('Dialog closed');
    },
  });

  const handleOpenWithContent = () => {
    dialog.actions.open({
      title: 'Welcome!',
      message: 'This is a dialog managed by useDialogBehavior',
    });
  };

  return (
    <div className="example-container">
      <h2>Dialog Behavior Example</h2>
      <p>
        This example demonstrates the <code>useDialogBehavior</code> hook from
        @web-loom/ui-core.
      </p>

      <div className="example-controls">
        <button onClick={handleOpenWithContent} className="btn btn-primary">
          Open Dialog
        </button>
        <button
          onClick={() => dialog.actions.toggle()}
          className="btn btn-secondary"
        >
          Toggle Dialog
        </button>
      </div>

      <div className="example-state">
        <h3>Current State:</h3>
        <pre>{JSON.stringify(dialog, null, 2)}</pre>
      </div>

      {dialog.isOpen && (
        <div className="dialog-overlay" onClick={() => dialog.actions.close()}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{dialog.content?.title || 'Dialog'}</h3>
              <button
                onClick={() => dialog.actions.close()}
                className="dialog-close"
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="dialog-body">
              <p>{dialog.content?.message || 'Dialog content'}</p>
            </div>
            <div className="dialog-footer">
              <button
                onClick={() => dialog.actions.close()}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
