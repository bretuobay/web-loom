import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App integration', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('supports storefront -> cart -> command palette checkout flow', async () => {
    render(<App />);

    await screen.findByRole('heading', { name: 'Storefront' });
    const addButtons = await screen.findAllByRole('button', { name: 'Add to cart' });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cart \(1\)/ })).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const paletteInput = await screen.findByPlaceholderText(/Type a command/i);
    fireEvent.change(paletteInput, { target: { value: 'checkout' } });
    fireEvent.keyDown(paletteInput, { key: 'Enter' });

    await screen.findByRole('heading', { name: 'Checkout' });
  });

  it('keeps product list available after remount (reload simulation)', async () => {
    const first = render(<App />);
    await screen.findByRole('heading', { name: 'Storefront' });
    expect(await screen.findAllByRole('button', { name: 'Add to cart' })).not.toHaveLength(0);

    first.unmount();

    render(<App />);
    await screen.findByRole('heading', { name: 'Storefront' });
    expect(await screen.findAllByRole('button', { name: 'Add to cart' })).not.toHaveLength(0);
  });
});
