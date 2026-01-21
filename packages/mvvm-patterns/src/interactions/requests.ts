import { InteractionRequest } from './InteractionRequest';
import { IConfirmation, INotification, IInputRequest, ISelectionRequest } from './types';

/**
 * Request for confirmation dialogs (Yes/No, OK/Cancel).
 *
 * @example
 * const confirmDelete = new ConfirmationRequest();
 * const response = await confirmDelete.raiseAsync({
 *   title: 'Delete Item',
 *   content: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   cancelText: 'Keep'
 * });
 */
export class ConfirmationRequest extends InteractionRequest<IConfirmation> {}

/**
 * Request for simple notifications (toast, snackbar, alert).
 *
 * @example
 * const notify = new NotificationRequest();
 * notify.raise({
 *   title: 'Success',
 *   content: 'Your changes have been saved.'
 * });
 */
export class NotificationRequest extends InteractionRequest<INotification> {}

/**
 * Request for user text input (prompt dialog).
 *
 * @example
 * const inputRequest = new InputRequest();
 * const response = await inputRequest.raiseAsync({
 *   title: 'Rename',
 *   content: 'Enter new name:',
 *   defaultValue: currentName,
 *   placeholder: 'Item name'
 * });
 * if (response.inputValue) { ... }
 */
export class InputRequest extends InteractionRequest<IInputRequest> {}

/**
 * Request for selection from a list of options.
 *
 * @example
 * const selectRequest = new SelectionRequest<Priority>();
 * const response = await selectRequest.raiseAsync({
 *   title: 'Set Priority',
 *   content: 'Choose priority level:',
 *   options: [
 *     { label: 'High', value: Priority.High },
 *     { label: 'Medium', value: Priority.Medium },
 *     { label: 'Low', value: Priority.Low }
 *   ]
 * });
 */
export class SelectionRequest<T = string> extends InteractionRequest<ISelectionRequest<T>> {}
