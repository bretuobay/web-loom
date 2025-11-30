/**
 * Vanilla JavaScript adapter for @web-loom/forms-core
 */

export { FormController } from './FormController';
export { FieldController } from './FieldController';
export { FormBinder } from './FormBinder';
export { createFormController } from './createFormController';

export type {
  FormControllerConfig,
  FormControllerInstance,
  FieldControllerConfig,
  FieldControllerInstance,
  FormBinderConfig,
  FormSubmitHandler,
  ElementBinder,
  ValidationDisplayConfig,
} from './types';

export { DOMHelpers } from './utils/DOMHelpers';
export { EventHelpers } from './utils/EventHelpers';
