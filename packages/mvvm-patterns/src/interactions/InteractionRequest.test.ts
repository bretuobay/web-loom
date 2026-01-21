import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import {
  InteractionRequest,
  ConfirmationRequest,
  NotificationRequest,
  InputRequest,
  SelectionRequest,
  IConfirmation,
  INotification,
  IInputRequest,
  ISelectionRequest,
} from './index';

describe('InteractionRequest', () => {
  let request: InteractionRequest<INotification>;

  beforeEach(() => {
    request = new InteractionRequest<INotification>();
  });

  describe('raise', () => {
    it('should emit event on requested$', async () => {
      const eventPromise = firstValueFrom(request.requested$);

      request.raise({ content: 'Test message' });

      const event = await eventPromise;
      expect(event.context.content).toBe('Test message');
    });

    it('should emit event with title', async () => {
      const eventPromise = firstValueFrom(request.requested$);

      request.raise({ title: 'Test Title', content: 'Test message' });

      const event = await eventPromise;
      expect(event.context.title).toBe('Test Title');
      expect(event.context.content).toBe('Test message');
    });

    it('should invoke callback when provided', async () => {
      const callback = vi.fn();

      request.requested$.subscribe((event) => {
        event.callback({ content: 'Response' });
      });

      request.raise({ content: 'Test' }, callback);

      // Wait a tick for async execution
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledWith({ content: 'Response' });
    });

    it('should not throw when callback is not provided', () => {
      request.requested$.subscribe((event) => {
        event.callback({ content: 'Response' });
      });

      expect(() => request.raise({ content: 'Test' })).not.toThrow();
    });

    it('should provide default no-op callback', async () => {
      const eventPromise = firstValueFrom(request.requested$);

      request.raise({ content: 'Test' });

      const event = await eventPromise;
      expect(event.callback).toBeDefined();
      expect(typeof event.callback).toBe('function');
      expect(() => event.callback({ content: 'Test' })).not.toThrow();
    });
  });

  describe('raiseAsync', () => {
    it('should return promise that resolves with response', async () => {
      const confirmRequest = new InteractionRequest<IConfirmation>();

      // Simulate view handling the request
      confirmRequest.requested$.subscribe((event) => {
        event.callback({ ...event.context, confirmed: true });
      });

      const response = await confirmRequest.raiseAsync({
        content: 'Confirm?',
      });

      expect(response.confirmed).toBe(true);
      expect(response.content).toBe('Confirm?');
    });

    it('should work with async/await pattern', async () => {
      const confirmRequest = new ConfirmationRequest();

      confirmRequest.requested$.subscribe((event) => {
        // Simulate async dialog
        setTimeout(() => {
          event.callback({ ...event.context, confirmed: false });
        }, 10);
      });

      const response = await confirmRequest.raiseAsync({
        title: 'Delete',
        content: 'Are you sure?',
      });

      expect(response.confirmed).toBe(false);
      expect(response.title).toBe('Delete');
    });

    it('should preserve all context properties', async () => {
      const response = await new Promise<IConfirmation>((resolve) => {
        const confirmRequest = new ConfirmationRequest();

        confirmRequest.requested$.subscribe((event) => {
          event.callback({
            ...event.context,
            confirmed: true,
          });
        });

        confirmRequest
          .raiseAsync({
            title: 'Confirm Action',
            content: 'Proceed with action?',
            confirmText: 'Yes',
            cancelText: 'No',
          })
          .then(resolve);
      });

      expect(response.title).toBe('Confirm Action');
      expect(response.content).toBe('Proceed with action?');
      expect(response.confirmText).toBe('Yes');
      expect(response.cancelText).toBe('No');
      expect(response.confirmed).toBe(true);
    });
  });

  describe('multiple requests', () => {
    it('should handle sequential requests', async () => {
      const contexts: string[] = [];

      request.requested$.subscribe((event) => {
        contexts.push(event.context.content);
        event.callback(event.context);
      });

      await request.raiseAsync({ content: 'First' });
      await request.raiseAsync({ content: 'Second' });
      await request.raiseAsync({ content: 'Third' });

      expect(contexts).toEqual(['First', 'Second', 'Third']);
    });

    it('should handle concurrent requests', async () => {
      const contexts: string[] = [];

      request.requested$.subscribe((event) => {
        contexts.push(event.context.content);
        // Simulate async handling with varying delays
        setTimeout(() => {
          event.callback(event.context);
        }, Math.random() * 10);
      });

      const promises = [
        request.raiseAsync({ content: 'Request 1' }),
        request.raiseAsync({ content: 'Request 2' }),
        request.raiseAsync({ content: 'Request 3' }),
      ];

      await Promise.all(promises);

      expect(contexts).toHaveLength(3);
      expect(contexts).toContain('Request 1');
      expect(contexts).toContain('Request 2');
      expect(contexts).toContain('Request 3');
    });
  });

  describe('dispose', () => {
    it('should complete requested$ observable', async () => {
      const completeSpy = vi.fn();

      request.requested$.subscribe({ complete: completeSpy });
      request.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not emit after dispose', () => {
      const emissions: INotification[] = [];

      request.requested$.subscribe((event) => {
        emissions.push(event.context);
      });

      request.raise({ content: 'Before dispose' });
      request.dispose();
      request.raise({ content: 'After dispose' });

      expect(emissions).toHaveLength(1);
      expect(emissions[0].content).toBe('Before dispose');
    });
  });
});

describe('ConfirmationRequest', () => {
  it('should work with IConfirmation type', async () => {
    const request = new ConfirmationRequest();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        confirmed: true,
      });
    });

    const response = await request.raiseAsync({
      title: 'Confirm',
      content: 'Proceed?',
      confirmText: 'Yes',
      cancelText: 'No',
    });

    expect(response.confirmed).toBe(true);
    expect(response.title).toBe('Confirm');
    expect(response.confirmText).toBe('Yes');
    expect(response.cancelText).toBe('No');
  });

  it('should handle cancellation', async () => {
    const request = new ConfirmationRequest();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        confirmed: false,
      });
    });

    const response = await request.raiseAsync({
      content: 'Delete item?',
    });

    expect(response.confirmed).toBe(false);
  });
});

describe('NotificationRequest', () => {
  it('should work with INotification type', async () => {
    const request = new NotificationRequest();
    const callback = vi.fn();

    request.requested$.subscribe((event) => {
      expect(event.context.title).toBe('Success');
      expect(event.context.content).toBe('Operation completed');
      event.callback(event.context);
    });

    request.raise(
      {
        title: 'Success',
        content: 'Operation completed',
      },
      callback,
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(callback).toHaveBeenCalled();
  });

  it('should work without callback for fire-and-forget notifications', () => {
    const request = new NotificationRequest();
    const emissions: INotification[] = [];

    request.requested$.subscribe((event) => {
      emissions.push(event.context);
    });

    request.raise({ content: 'Info message' });
    request.raise({ title: 'Warning', content: 'Warning message' });

    expect(emissions).toHaveLength(2);
    expect(emissions[0].content).toBe('Info message');
    expect(emissions[1].title).toBe('Warning');
  });
});

describe('InputRequest', () => {
  it('should work with IInputRequest type', async () => {
    const request = new InputRequest();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        inputValue: 'User input',
      });
    });

    const response = await request.raiseAsync({
      title: 'Enter Name',
      content: 'Please enter your name:',
      placeholder: 'John Doe',
      inputType: 'text',
      defaultValue: '',
    });

    expect(response.inputValue).toBe('User input');
    expect(response.placeholder).toBe('John Doe');
    expect(response.inputType).toBe('text');
  });

  it('should handle different input types', async () => {
    const request = new InputRequest();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        inputValue: '42',
      });
    });

    const response = await request.raiseAsync({
      content: 'Enter age:',
      inputType: 'number',
    });

    expect(response.inputValue).toBe('42');
    expect(response.inputType).toBe('number');
  });
});

describe('SelectionRequest', () => {
  it('should work with ISelectionRequest type', async () => {
    const request = new SelectionRequest<string>();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        selectedValue: 'option2',
      });
    });

    const response = await request.raiseAsync({
      title: 'Choose Option',
      content: 'Select one:',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
      ],
    });

    expect(response.selectedValue).toBe('option2');
    expect(response.options).toHaveLength(3);
  });

  it('should work with typed values', async () => {
    enum Priority {
      Low = 1,
      Medium = 2,
      High = 3,
    }

    const request = new SelectionRequest<Priority>();

    request.requested$.subscribe((event) => {
      event.callback({
        ...event.context,
        selectedValue: Priority.High,
      });
    });

    const response = await request.raiseAsync({
      content: 'Select priority:',
      options: [
        { label: 'Low', value: Priority.Low },
        { label: 'Medium', value: Priority.Medium },
        { label: 'High', value: Priority.High },
      ],
    });

    expect(response.selectedValue).toBe(Priority.High);
  });

  it('should support multiple selection flag', async () => {
    const request = new SelectionRequest<string>();

    request.requested$.subscribe((event) => {
      expect(event.context.allowMultiple).toBe(true);
      event.callback(event.context);
    });

    await request.raiseAsync({
      content: 'Select tags:',
      options: [
        { label: 'Tag 1', value: 'tag1' },
        { label: 'Tag 2', value: 'tag2' },
      ],
      allowMultiple: true,
    });
  });
});

describe('Integration scenarios', () => {
  it('should support ViewModel with multiple interaction requests', async () => {
    class TestViewModel {
      readonly confirmDelete = new ConfirmationRequest();
      readonly notify = new NotificationRequest();
      readonly promptRename = new InputRequest();

      async deleteItem(): Promise<boolean> {
        const response = await this.confirmDelete.raiseAsync({
          title: 'Delete Item',
          content: 'Are you sure?',
        });

        if (response.confirmed) {
          this.notify.raise({
            title: 'Success',
            content: 'Item deleted',
          });
          return true;
        }
        return false;
      }

      async renameItem(): Promise<string | null> {
        const response = await this.promptRename.raiseAsync({
          title: 'Rename',
          content: 'Enter new name:',
        });

        return response.inputValue || null;
      }
    }

    const vm = new TestViewModel();

    // Set up handlers
    vm.confirmDelete.requested$.subscribe((event) => {
      event.callback({ ...event.context, confirmed: true });
    });

    vm.notify.requested$.subscribe((event) => {
      expect(event.context.content).toBe('Item deleted');
    });

    vm.promptRename.requested$.subscribe((event) => {
      event.callback({ ...event.context, inputValue: 'New Name' });
    });

    // Test delete flow
    const deleted = await vm.deleteItem();
    expect(deleted).toBe(true);

    // Test rename flow
    const newName = await vm.renameItem();
    expect(newName).toBe('New Name');
  });
});
