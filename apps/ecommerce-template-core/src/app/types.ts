import type { IConfirmation } from '@web-loom/mvvm-patterns';

export interface ToastMessage {
  id: string;
  message: string;
}

export interface PendingConfirmation {
  context: IConfirmation;
  callback: (response: IConfirmation) => void;
}
