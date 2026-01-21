/**
 * Examples demonstrating DirtyTracker and FieldDirtyTracker usage
 */

import { BehaviorSubject } from 'rxjs';
import { DirtyTracker, FieldDirtyTracker } from './DirtyTracker';

// ============================================================================
// Example 1: Basic DirtyTracker Usage
// ============================================================================

interface UserProfile {
  name: string;
  email: string;
  age: number;
}

export function basicDirtyTrackingExample() {
  const tracker = new DirtyTracker<UserProfile>();

  // Set initial value (e.g., loaded from API)
  tracker.setInitialValue({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  });

  console.log('Initial state - isDirty:', tracker.isDirty); // false

  // User edits the form
  tracker.setCurrentValue({
    name: 'Jane Doe',
    email: 'john@example.com',
    age: 30,
  });

  console.log('After edit - isDirty:', tracker.isDirty); // true

  // Save the changes
  tracker.markClean();
  console.log('After save - isDirty:', tracker.isDirty); // false

  // Cleanup
  tracker.dispose();
}

// ============================================================================
// Example 2: Observable Tracking
// ============================================================================

export function observableTrackingExample() {
  const formData$ = new BehaviorSubject<UserProfile>({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  });

  const tracker = new DirtyTracker<UserProfile>();

  // Automatically track changes from observable
  tracker.trackObservable(formData$);

  // Subscribe to dirty state changes
  const subscription = tracker.isDirty$.subscribe((isDirty) => {
    console.log('Form dirty state changed:', isDirty);
  });

  // Simulate user edits
  formData$.next({
    name: 'Jane Doe',
    email: 'john@example.com',
    age: 30,
  });

  console.log('After edit - isDirty:', tracker.isDirty); // true

  // Cleanup
  subscription.unsubscribe();
  tracker.dispose();
}

// ============================================================================
// Example 3: Field-Level Dirty Tracking
// ============================================================================

export function fieldDirtyTrackingExample() {
  const tracker = new FieldDirtyTracker<UserProfile>();

  tracker.setInitialValue({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  });

  // User edits name and email
  tracker.setCurrentValue({
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 30,
  });

  // Check which fields are dirty
  console.log('Name is dirty:', tracker.isFieldDirty('name')); // true
  console.log('Email is dirty:', tracker.isFieldDirty('email')); // true
  console.log('Age is dirty:', tracker.isFieldDirty('age')); // false

  // Get all dirty fields
  console.log('Dirty fields:', tracker.getDirtyFields()); // ['name', 'email']

  // Get only changed values (for PATCH requests)
  console.log('Changes:', tracker.getChanges()); // { name: 'Jane Doe', email: 'jane@example.com' }

  // Cleanup
  tracker.dispose();
}

// ============================================================================
// Example 4: Form ViewModel Integration
// ============================================================================

export class UserFormViewModel {
  private tracker = new FieldDirtyTracker<UserProfile>();
  private formData$ = new BehaviorSubject<UserProfile>({
    name: '',
    email: '',
    age: 0,
  });

  public readonly isDirty$ = this.tracker.isDirty$;
  public readonly dirtyFields$ = this.tracker.dirtyFields$;

  constructor() {
    // Track form data changes
    this.tracker.trackObservable(this.formData$);
  }

  loadUser(user: UserProfile): void {
    this.formData$.next(user);
    this.tracker.setInitialValue(user);
  }

  updateField<K extends keyof UserProfile>(field: K, value: UserProfile[K]): void {
    const current = this.formData$.value;
    this.formData$.next({ ...current, [field]: value });
  }

  async save(): Promise<void> {
    if (!this.tracker.isDirty) {
      console.log('No changes to save');
      return;
    }

    const changes = this.tracker.getChanges();
    console.log('Saving changes:', changes);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mark as clean after successful save
    this.tracker.markClean();
  }

  reset(): void {
    const initialValue = this.tracker.reset();
    if (initialValue) {
      this.formData$.next(initialValue);
    }
  }

  isFieldDirty(field: keyof UserProfile): boolean {
    return this.tracker.isFieldDirty(field);
  }

  dispose(): void {
    this.tracker.dispose();
    this.formData$.complete();
  }
}

// ============================================================================
// Example 5: Navigation Guard
// ============================================================================

export class FormWithNavigationGuard {
  private tracker = new DirtyTracker<UserProfile>();

  setFormData(data: UserProfile): void {
    this.tracker.setCurrentValue(data);
  }

  async canNavigateAway(): Promise<boolean> {
    if (!this.tracker.isDirty) {
      return true;
    }

    // In a real app, this would show a dialog
    const userConfirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
    return userConfirmed;
  }

  dispose(): void {
    this.tracker.dispose();
  }
}

// ============================================================================
// Example 6: Conditional Save Button
// ============================================================================

export class FormWithConditionalSave {
  private tracker = new DirtyTracker<UserProfile>();

  public readonly canSave$ = this.tracker.isDirty$;

  setInitialData(data: UserProfile): void {
    this.tracker.setInitialValue(data);
  }

  updateData(data: UserProfile): void {
    this.tracker.setCurrentValue(data);
  }

  async save(): Promise<void> {
    if (!this.tracker.isDirty) {
      console.log('Save button should be disabled');
      return;
    }

    const dataToSave = this.tracker.getCurrentValue();
    console.log('Saving:', dataToSave);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.tracker.markClean();
  }

  dispose(): void {
    this.tracker.dispose();
  }
}

// ============================================================================
// Example 7: Reset Functionality
// ============================================================================

export function resetExample() {
  const tracker = new DirtyTracker<UserProfile>();

  tracker.setInitialValue({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  });

  // User makes changes
  tracker.setCurrentValue({
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 25,
  });

  console.log('After changes - isDirty:', tracker.isDirty); // true

  // User clicks "Reset" button
  const resetValue = tracker.reset();
  console.log('Reset to:', resetValue); // { name: 'John Doe', email: 'john@example.com', age: 30 }
  console.log('After reset - isDirty:', tracker.isDirty); // false

  tracker.dispose();
}

// ============================================================================
// Example 8: Partial Updates (PATCH)
// ============================================================================

export class FormWithPartialUpdates {
  private tracker = new FieldDirtyTracker<UserProfile>();

  setInitialData(data: UserProfile): void {
    this.tracker.setInitialValue(data);
  }

  updateData(data: UserProfile): void {
    this.tracker.setCurrentValue(data);
  }

  async saveChanges(): Promise<void> {
    const changes = this.tracker.getChanges();

    if (Object.keys(changes).length === 0) {
      console.log('No changes to save');
      return;
    }

    console.log('Sending PATCH request with:', changes);

    // Simulate API PATCH request
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.tracker.markClean();
  }

  dispose(): void {
    this.tracker.dispose();
  }
}
