/**
 * React Framework Adapters
 * 
 * This module provides React hooks for all UI Core behaviors.
 * These hooks handle behavior lifecycle, state subscriptions, and cleanup.
 */

import { useState, useEffect, useRef } from 'react';
import type {
  DialogBehavior,
  DialogState,
  DialogActions,
  DialogBehaviorOptions,
  RovingFocusBehavior,
  RovingFocusState,
  RovingFocusActions,
  RovingFocusOptions,
  ListSelectionBehavior,
  ListSelectionState,
  ListSelectionActions,
  ListSelectionOptions,
  DisclosureBehavior,
  DisclosureState,
  DisclosureActions,
  DisclosureBehaviorOptions,
  FormBehavior,
  FormState,
  FormActions,
  FormBehaviorOptions,
} from '../../behaviors';
import {
  createDialogBehavior,
  createRovingFocus,
  createListSelection,
  createDisclosureBehavior,
  createFormBehavior,
} from '../../behaviors';

/**
 * React hook for dialog behavior.
 * 
 * Creates and manages a dialog behavior instance, automatically handling
 * subscriptions and cleanup.
 * 
 * @example
 * ```tsx
 * function MyDialog() {
 *   const dialog = useDialogBehavior({
 *     id: 'my-dialog',
 *     onOpen: (content) => console.log('Opened:', content),
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={() => dialog.actions.open({ title: 'Hello' })}>
 *         Open Dialog
 *       </button>
 *       {dialog.isOpen && (
 *         <div className="dialog">
 *           <h2>{dialog.content?.title}</h2>
 *           <button onClick={dialog.actions.close}>Close</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the dialog behavior.
 * @returns Dialog state and actions.
 */
export function useDialogBehavior(
  options?: DialogBehaviorOptions
): DialogState & { actions: DialogActions } {
  const behaviorRef = useRef<DialogBehavior | null>(null);
  
  // Initialize behavior only once
  if (behaviorRef.current === null) {
    behaviorRef.current = createDialogBehavior(options);
  }

  const [state, setState] = useState<DialogState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    // Subscribe to state changes
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}

/**
 * React hook for roving focus behavior.
 * 
 * Creates and manages a roving focus behavior instance for keyboard navigation
 * through lists, menus, and other collections.
 * 
 * @example
 * ```tsx
 * function Menu() {
 *   const focus = useRovingFocus({
 *     items: ['item-1', 'item-2', 'item-3'],
 *     orientation: 'vertical',
 *   });
 * 
 *   return (
 *     <ul onKeyDown={(e) => {
 *       if (e.key === 'ArrowDown') focus.actions.moveNext();
 *       if (e.key === 'ArrowUp') focus.actions.movePrevious();
 *     }}>
 *       {focus.items.map((item, index) => (
 *         <li
 *           key={item}
 *           tabIndex={focus.currentIndex === index ? 0 : -1}
 *         >
 *           {item}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the roving focus behavior.
 * @returns Roving focus state and actions.
 */
export function useRovingFocus(
  options?: RovingFocusOptions
): RovingFocusState & { actions: RovingFocusActions } {
  const behaviorRef = useRef<RovingFocusBehavior | null>(null);
  
  if (behaviorRef.current === null) {
    behaviorRef.current = createRovingFocus(options);
  }

  const [state, setState] = useState<RovingFocusState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}

/**
 * React hook for list selection behavior.
 * 
 * Creates and manages a list selection behavior instance with support for
 * single, multi, and range selection modes.
 * 
 * @example
 * ```tsx
 * function FileList() {
 *   const selection = useListSelection({
 *     items: ['file-1', 'file-2', 'file-3'],
 *     mode: 'multi',
 *   });
 * 
 *   return (
 *     <ul>
 *       {selection.items.map((item) => (
 *         <li
 *           key={item}
 *           onClick={() => selection.actions.toggleSelection(item)}
 *           className={selection.selectedIds.includes(item) ? 'selected' : ''}
 *         >
 *           {item}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the list selection behavior.
 * @returns List selection state and actions.
 */
export function useListSelection(
  options?: ListSelectionOptions
): ListSelectionState & { actions: ListSelectionActions } {
  const behaviorRef = useRef<ListSelectionBehavior | null>(null);
  
  if (behaviorRef.current === null) {
    behaviorRef.current = createListSelection(options);
  }

  const [state, setState] = useState<ListSelectionState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}

/**
 * React hook for disclosure behavior.
 * 
 * Creates and manages a disclosure behavior instance for expandable/collapsible
 * content like accordions and collapsible sections.
 * 
 * @example
 * ```tsx
 * function Accordion() {
 *   const disclosure = useDisclosureBehavior({
 *     id: 'section-1',
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={disclosure.actions.toggle}>
 *         {disclosure.isExpanded ? 'Collapse' : 'Expand'}
 *       </button>
 *       {disclosure.isExpanded && (
 *         <div className="content">
 *           Expandable content here
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the disclosure behavior.
 * @returns Disclosure state and actions.
 */
export function useDisclosureBehavior(
  options?: DisclosureBehaviorOptions
): DisclosureState & { actions: DisclosureActions } {
  const behaviorRef = useRef<DisclosureBehavior | null>(null);
  
  if (behaviorRef.current === null) {
    behaviorRef.current = createDisclosureBehavior(options);
  }

  const [state, setState] = useState<DisclosureState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}

/**
 * React hook for form behavior.
 * 
 * Creates and manages a form behavior instance with validation support.
 * 
 * @example
 * ```tsx
 * function LoginForm() {
 *   const form = useFormBehavior({
 *     initialValues: { email: '', password: '' },
 *     fields: {
 *       email: {
 *         validate: (value) => {
 *           if (!value) return 'Email is required';
 *           if (!value.includes('@')) return 'Invalid email';
 *           return null;
 *         },
 *       },
 *       password: {
 *         validate: (value) => {
 *           if (!value) return 'Password is required';
 *           if (value.length < 8) return 'Password must be at least 8 characters';
 *           return null;
 *         },
 *       },
 *     },
 *     onSubmit: async (values) => {
 *       await login(values);
 *     },
 *   });
 * 
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       form.actions.submitForm();
 *     }}>
 *       <input
 *         type="email"
 *         value={form.values.email}
 *         onChange={(e) => form.actions.setFieldValue('email', e.target.value)}
 *         onBlur={() => form.actions.setFieldTouched('email', true)}
 *       />
 *       {form.touched.email && form.errors.email && (
 *         <span className="error">{form.errors.email}</span>
 *       )}
 *       
 *       <input
 *         type="password"
 *         value={form.values.password}
 *         onChange={(e) => form.actions.setFieldValue('password', e.target.value)}
 *         onBlur={() => form.actions.setFieldTouched('password', true)}
 *       />
 *       {form.touched.password && form.errors.password && (
 *         <span className="error">{form.errors.password}</span>
 *       )}
 *       
 *       <button type="submit" disabled={!form.isValid || form.isSubmitting}>
 *         {form.isSubmitting ? 'Submitting...' : 'Login'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the form behavior.
 * @returns Form state and actions.
 */
export function useFormBehavior<T extends Record<string, any>>(
  options: FormBehaviorOptions<T>
): FormState<T> & { actions: FormActions<T> } {
  const behaviorRef = useRef<FormBehavior<T> | null>(null);
  
  if (behaviorRef.current === null) {
    behaviorRef.current = createFormBehavior<T>(options);
  }

  const [state, setState] = useState<FormState<T>>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}
