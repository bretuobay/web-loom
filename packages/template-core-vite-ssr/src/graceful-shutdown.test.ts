import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachGracefulShutdown, type TemplateCoreViteSsrServer } from './index.js';

function makeFakeServer(): TemplateCoreViteSsrServer & { close: ReturnType<typeof vi.fn> } {
  return {
    vite: undefined,
    listen: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as TemplateCoreViteSsrServer & { close: ReturnType<typeof vi.fn> };
}

describe('attachGracefulShutdown', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let detach: (() => void) | null = null;

  afterEach(() => {
    detach?.();
    detach = null;
    exitSpy?.mockRestore();
  });

  it('closes the server and exits on SIGTERM', async () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const server = makeFakeServer();
    detach = attachGracefulShutdown(server, { signals: ['SIGTERM'] });

    process.emit('SIGTERM');
    await vi.waitFor(() => expect(server.close).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
  });

  it('removes its listeners once detached, so a later signal does not close the server again', async () => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const server = makeFakeServer();
    const detachFn = attachGracefulShutdown(server, { signals: ['SIGTERM'] });
    detach = detachFn;

    detachFn();
    process.emit('SIGTERM');

    // Give any (incorrectly still-registered) handler a tick to run before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(server.close).not.toHaveBeenCalled();
  });
});
