import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, BehaviorSubject } from 'rxjs';
import { CompositeCommand } from './CompositeCommand';
import { Command } from './Command';

describe('CompositeCommand', () => {
  describe('registration', () => {
    it('should register commands', () => {
      const composite = new CompositeCommand();
      const cmd1 = new Command(async () => {});
      const cmd2 = new Command(async () => {});

      composite.register(cmd1);
      composite.register(cmd2);

      expect(composite.registeredCommands).toHaveLength(2);
      expect(composite.registeredCommands).toContain(cmd1);
      expect(composite.registeredCommands).toContain(cmd2);
    });

    it('should unregister commands', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      expect(composite.registeredCommands).toHaveLength(1);

      composite.unregister(cmd);
      expect(composite.registeredCommands).toHaveLength(0);
    });

    it('should not register duplicate commands', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      composite.register(cmd); // Try to register again

      // Set only keeps unique items
      expect(composite.registeredCommands).toHaveLength(1);
    });

    it('should not register to disposed composite', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      composite.dispose();
      composite.register(cmd);

      expect(consoleSpy).toHaveBeenCalledWith('Cannot register command to disposed CompositeCommand');
      expect(composite.registeredCommands).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('canExecute$', () => {
    it('should be true when all commands can execute', async () => {
      const composite = new CompositeCommand();
      const cmd1 = new Command(async () => {});
      const cmd2 = new Command(async () => {});

      composite.register(cmd1);
      composite.register(cmd2);

      const canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true);
    });

    it('should be false when any command cannot execute', async () => {
      const composite = new CompositeCommand();
      const canExecute1$ = new BehaviorSubject(true);
      const canExecute2$ = new BehaviorSubject(false);

      const cmd1 = new Command(async () => {}, canExecute1$);
      const cmd2 = new Command(async () => {}, canExecute2$);

      composite.register(cmd1);
      composite.register(cmd2);

      await new Promise(resolve => setTimeout(resolve, 10));

      const canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(false);
    });

    it('should be true when no commands registered', async () => {
      const composite = new CompositeCommand();
      const canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true);
    });

    it('should update when child command canExecute changes', async () => {
      const composite = new CompositeCommand();
      const canExecute$ = new BehaviorSubject(true);
      const cmd = new Command(async () => {}, canExecute$);

      composite.register(cmd);

      await new Promise(resolve => setTimeout(resolve, 10));

      let canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true);

      canExecute$.next(false);
      await new Promise(resolve => setTimeout(resolve, 10));

      canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(false);
    });

    it('should update when commands are added/removed', async () => {
      const composite = new CompositeCommand();
      const canExecute$ = new BehaviorSubject(false);
      const cmd = new Command(async () => {}, canExecute$);

      composite.register(cmd);
      await new Promise(resolve => setTimeout(resolve, 10));

      let canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(false);

      composite.unregister(cmd);
      await new Promise(resolve => setTimeout(resolve, 10));

      canExecute = await firstValueFrom(composite.canExecute$);
      expect(canExecute).toBe(true); // No commands = can execute
    });
  });

  describe('execute', () => {
    it('should execute all commands in parallel by default', async () => {
      const results: number[] = [];
      const composite = new CompositeCommand();

      const cmd1 = new Command(async () => { results.push(1); return 'a'; });
      const cmd2 = new Command(async () => { results.push(2); return 'b'; });

      composite.register(cmd1);
      composite.register(cmd2);

      const result = await composite.execute();

      expect(result).toEqual(['a', 'b']);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should execute sequentially when configured', async () => {
      const results: number[] = [];
      const composite = new CompositeCommand({ executionMode: 'sequential' });

      const cmd1 = new Command(async () => {
        await new Promise(r => setTimeout(r, 10));
        results.push(1);
        return 'a';
      });
      const cmd2 = new Command(async () => {
        results.push(2);
        return 'b';
      });

      composite.register(cmd1);
      composite.register(cmd2);

      await composite.execute();

      expect(results).toEqual([1, 2]); // Sequential order
    });

    it('should return empty array when no commands', async () => {
      const composite = new CompositeCommand();
      const result = await composite.execute();
      expect(result).toEqual([]);
    });

    it('should pass parameter to all commands', async () => {
      const composite = new CompositeCommand<string>();
      const spy1 = vi.fn(async (param: string) => param + '1');
      const spy2 = vi.fn(async (param: string) => param + '2');

      const cmd1 = new Command(spy1);
      const cmd2 = new Command(spy2);

      composite.register(cmd1);
      composite.register(cmd2);

      await composite.execute('test');

      expect(spy1).toHaveBeenCalledWith('test');
      expect(spy2).toHaveBeenCalledWith('test');
    });

    it('should set executeError$ on failure', async () => {
      const composite = new CompositeCommand();
      const error = new Error('Test error');
      const cmd = new Command(async () => { throw error; });

      composite.register(cmd);

      await expect(composite.execute()).rejects.toThrow('Test error');

      const executeError = await firstValueFrom(composite.executeError$);
      expect(executeError).toBe(error);
    });

    it('should not execute on disposed composite', async () => {
      const composite = new CompositeCommand();
      const spy = vi.fn(async () => {});
      const cmd = new Command(spy);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      composite.register(cmd);
      composite.dispose();

      const result = await composite.execute();

      expect(result).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cannot execute disposed CompositeCommand');

      consoleSpy.mockRestore();
    });
  });

  describe('isExecuting$', () => {
    it('should be true while any command is executing', async () => {
      const composite = new CompositeCommand();
      let resolveCmd: () => void;
      const cmdPromise = new Promise<void>(r => { resolveCmd = r; });

      const cmd = new Command(async () => { await cmdPromise; });
      composite.register(cmd);

      const executePromise = composite.execute();

      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should be executing
      const isExecuting = await firstValueFrom(composite.isExecuting$);
      expect(isExecuting).toBe(true);

      resolveCmd!();
      await executePromise;

      // Should no longer be executing
      const isExecutingAfter = await firstValueFrom(composite.isExecuting$);
      expect(isExecutingAfter).toBe(false);
    });

    it('should be false initially', async () => {
      const composite = new CompositeCommand();
      const isExecuting = await firstValueFrom(composite.isExecuting$);
      expect(isExecuting).toBe(false);
    });

    it('should track child command execution state', async () => {
      const composite = new CompositeCommand();
      let resolveCmd: () => void;
      const cmdPromise = new Promise<void>(r => { resolveCmd = r; });

      const cmd = new Command(async () => { await cmdPromise; });
      composite.register(cmd);

      // Start execution
      const executePromise = cmd.execute();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Composite should show as executing
      const isExecuting = await firstValueFrom(composite.isExecuting$);
      expect(isExecuting).toBe(true);

      resolveCmd!();
      await executePromise;
    });
  });

  describe('monitorCommandActivity', () => {
    it('should filter by isActive when enabled', async () => {
      const composite = new CompositeCommand({ monitorCommandActivity: true });
      const spy1 = vi.fn(async () => 'result1');
      const spy2 = vi.fn(async () => 'result2');

      const cmd1 = new Command(spy1);
      const cmd2 = new Command(spy2);

      // Add isActive property to simulate IActiveAware
      (cmd1 as any).isActive = true;
      (cmd2 as any).isActive = false;

      composite.register(cmd1);
      composite.register(cmd2);

      const results = await composite.execute();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      expect(results).toEqual(['result1']);
    });

    it('should execute all commands when monitorCommandActivity is false', async () => {
      const composite = new CompositeCommand({ monitorCommandActivity: false });
      const spy1 = vi.fn(async () => 'result1');
      const spy2 = vi.fn(async () => 'result2');

      const cmd1 = new Command(spy1);
      const cmd2 = new Command(spy2);

      (cmd1 as any).isActive = true;
      (cmd2 as any).isActive = false;

      composite.register(cmd1);
      composite.register(cmd2);

      const results = await composite.execute();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(results).toEqual(['result1', 'result2']);
    });

    it('should execute commands without isActive property', async () => {
      const composite = new CompositeCommand({ monitorCommandActivity: true });
      const spy = vi.fn(async () => 'result');
      const cmd = new Command(spy);

      composite.register(cmd);

      const results = await composite.execute();

      expect(spy).toHaveBeenCalled();
      expect(results).toEqual(['result']);
    });
  });

  describe('disposal', () => {
    it('should clear commands on dispose', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      expect(composite.registeredCommands).toHaveLength(1);

      composite.dispose();

      expect(composite.registeredCommands).toHaveLength(0);
    });

    it('should complete observables on dispose', () => {
      const composite = new CompositeCommand();
      const completeSpy = vi.fn();

      composite.isExecuting$.subscribe({ complete: completeSpy });

      composite.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not throw when disposing twice', () => {
      const composite = new CompositeCommand();

      expect(() => {
        composite.dispose();
        composite.dispose();
      }).not.toThrow();
    });

    it('should unsubscribe from child command observables', () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => {});

      composite.register(cmd);
      composite.dispose();

      // Should not throw or cause issues
      expect(composite.registeredCommands).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle commands that return undefined', async () => {
      const composite = new CompositeCommand();
      const cmd = new Command(async () => undefined);

      composite.register(cmd);

      const results = await composite.execute();

      expect(results).toEqual([undefined]);
    });

    it('should handle mixed success and failure in parallel mode', async () => {
      const composite = new CompositeCommand({ executionMode: 'parallel' });
      const cmd1 = new Command(async () => 'success');
      const cmd2 = new Command(async () => { throw new Error('fail'); });

      composite.register(cmd1);
      composite.register(cmd2);

      await expect(composite.execute()).rejects.toThrow('fail');
    });

    it('should stop on first error in sequential mode', async () => {
      const composite = new CompositeCommand({ executionMode: 'sequential' });
      const spy1 = vi.fn(async () => { throw new Error('fail'); });
      const spy2 = vi.fn(async () => 'success');

      const cmd1 = new Command(spy1);
      const cmd2 = new Command(spy2);

      composite.register(cmd1);
      composite.register(cmd2);

      await expect(composite.execute()).rejects.toThrow('fail');

      expect(spy1).toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled(); // Should not execute after error
    });
  });
});
