/**
 * Base notification data for interaction requests
 */
export interface INotification {
  title?: string;
  content: string;
}

/**
 * Confirmation request with response
 */
export interface IConfirmation extends INotification {
  confirmed?: boolean;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Input request with response
 */
export interface IInputRequest extends INotification {
  inputValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'email' | 'password';
  defaultValue?: string;
}

/**
 * Selection request with options
 */
export interface ISelectionRequest<T = string> extends INotification {
  options: Array<{ label: string; value: T }>;
  selectedValue?: T;
  allowMultiple?: boolean;
}

/**
 * Event emitted when interaction is requested
 */
export interface InteractionRequestedEvent<T> {
  /** The interaction context/data */
  readonly context: T;
  /** Callback to invoke with the response */
  callback: (response: T) => void;
}
