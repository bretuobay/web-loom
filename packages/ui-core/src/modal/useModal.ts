import { useCallback } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

export interface UseModalOptions {
  /**
   * Whether the modal is currently open.
   */
  open: boolean;
  /**
   * Handler called when the modal primary action is triggered.
   */
  onOk?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Handler called when the modal should close or cancel.
   */
  onCancel?: (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
  /**
   * Allow clicking on the backdrop to close the modal.
   * @default true
   */
  maskClosable?: boolean;
  /**
   * Allow pressing ESC to close the modal.
   * @default true
   */
  keyboard?: boolean;
}

export interface UseModalHandlers {
  /**
   * Handler to invoke when the primary action runs.
   */
  handleOk: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Handler to invoke when the modal should close.
   */
  handleCancel: (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
  /**
   * Handler for clicks on the backdrop.
   */
  handleBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Handler for keyboard events inside the modal container.
   */
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function useModal({
  open,
  onOk,
  onCancel,
  maskClosable = true,
  keyboard = true,
}: UseModalOptions): UseModalHandlers {
  const handleCancel = useCallback(
    (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
      if (!open) {
        return;
      }
      onCancel?.(event);
    },
    [open, onCancel],
  );

  const handleOk = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!open) {
        return;
      }
      onOk?.(event);
    },
    [open, onOk],
  );

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!maskClosable) {
        return;
      }
      if (event.target === event.currentTarget) {
        handleCancel(event);
      }
    },
    [maskClosable, handleCancel],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!keyboard) {
        return;
      }
      if (event.key === 'Escape') {
        handleCancel(event);
      }
    },
    [keyboard, handleCancel],
  );

  return {
    handleOk,
    handleCancel,
    handleBackdropClick,
    handleKeyDown,
  };
}
