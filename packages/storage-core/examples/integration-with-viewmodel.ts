/**
 * Example: Integrating storage-core with MVVM ViewModels
 *
 * This demonstrates how storage-core can persist ViewModel state
 * and restore it on application reload.
 */

import { createStorage } from '../src/index';

// Simulated ViewModel interface (from @web-loom/mvvm-core)
interface ViewModel {
  dispose(): void;
}

/**
 * A ViewModel that persists its state to storage
 */
class PersistentViewModel implements ViewModel {
  private storage: Awaited<ReturnType<typeof createStorage>>;
  private storageKey: string;
  private state: any;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
    this.state = {};
  }

  async init() {
    // Create storage instance
    this.storage = await createStorage({
      backend: ['localstorage', 'memory'],
      name: 'app-viewmodels',
      namespace: 'state',
    });

    // Restore state from storage
    const savedState = await this.storage.get(this.storageKey);
    if (savedState) {
      this.state = savedState;
      console.log('Restored state:', savedState);
    }

    // Subscribe to changes in other tabs
    this.storage.subscribe(this.storageKey, (event) => {
      if (event.newValue) {
        this.state = event.newValue;
        console.log('State synced from another tab:', event.newValue);
      }
    });
  }

  async setState(newState: any) {
    this.state = { ...this.state, ...newState };

    // Persist to storage
    await this.storage.set(this.storageKey, this.state);
  }

  getState() {
    return this.state;
  }

  dispose() {
    // Cleanup
    this.storage?.dispose();
  }
}

/**
 * Example: Form draft persistence
 */
class FormViewModel implements ViewModel {
  private storage: Awaited<ReturnType<typeof createStorage>>;
  private formId: string;

  constructor(formId: string) {
    this.formId = formId;
  }

  async init() {
    this.storage = await createStorage({
      backend: 'localstorage',
      name: 'form-drafts',
      defaultTTL: 86400000, // 24 hours
    });
  }

  async saveDraft(formData: Record<string, any>) {
    await this.storage.set(`draft:${this.formId}`, {
      data: formData,
      savedAt: Date.now(),
    });
  }

  async loadDraft() {
    return await this.storage.get(`draft:${this.formId}`);
  }

  async clearDraft() {
    await this.storage.delete(`draft:${this.formId}`);
  }

  dispose() {
    this.storage?.dispose();
  }
}

/**
 * Example: User preferences ViewModel
 */
class UserPreferencesViewModel implements ViewModel {
  private storage: Awaited<ReturnType<typeof createStorage>>;

  async init() {
    this.storage = await createStorage({
      backend: 'localstorage',
      name: 'user-preferences',
    });
  }

  async getTheme() {
    return (await this.storage.get('theme')) || 'light';
  }

  async setTheme(theme: 'light' | 'dark') {
    await this.storage.set('theme', theme);
  }

  async getLanguage() {
    return (await this.storage.get('language')) || 'en';
  }

  async setLanguage(language: string) {
    await this.storage.set('language', language);
  }

  async getAllPreferences() {
    return await this.storage.entries();
  }

  dispose() {
    this.storage?.dispose();
  }
}

export { PersistentViewModel, FormViewModel, UserPreferencesViewModel };
