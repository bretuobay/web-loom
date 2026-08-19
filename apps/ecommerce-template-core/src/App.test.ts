import { fireEvent, waitFor } from '@testing-library/dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';

async function mountApp() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp();
  await app.mount(container);

  return { app, container };
}

describe('template-core ecommerce demo', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the catalog and drives search and cart actions through templates', async () => {
    const { app, container } = await mountApp();
    await waitFor(() => expect(container.querySelectorAll('.product-card').length).toBeGreaterThan(0));

    const search = container.querySelector<HTMLInputElement>('#search-products');
    expect(search).not.toBeNull();
    fireEvent.input(search!, { target: { value: 'nonexistent product' } });
    await waitFor(() => expect(container.textContent).toContain('No products found for this search.'));

    fireEvent.input(search!, { target: { value: '' } });
    const addButton = container.querySelector<HTMLButtonElement>('.product-card .brand-btn');
    expect(addButton).not.toBeNull();
    fireEvent.click(addButton!);
    await waitFor(() =>
      expect(container.querySelector('.header-actions .brand-btn')?.textContent).toContain('Cart (1)'),
    );

    fireEvent.click(container.querySelector('.header-actions .brand-btn')!);
    expect(container.querySelector('.cart-drawer')).not.toBeNull();
    await waitFor(() => expect(container.querySelector('.toast-item')?.textContent).toMatch(/added to cart|Added/));

    app.unmount();
    container.remove();
  });

  it('navigates to checkout via the header link and clears on unmount', async () => {
    const { app, container } = await mountApp();
    await waitFor(() => expect(container.querySelector('.product-card')).not.toBeNull());

    fireEvent.click(container.querySelector<HTMLAnchorElement>('a[href="/checkout"]')!);
    await waitFor(() => expect(window.location.pathname).toBe('/checkout'));
    await waitFor(() => expect(container.querySelector('.checkout-panel h2')).not.toBeNull());
    expect(container.querySelector('.checkout-panel h2')?.textContent).toContain('Checkout');

    const email = container.querySelector<HTMLInputElement>('#checkout-email');
    expect(email?.value).toBe('');
    fireEvent.input(email!, { target: { value: 'ada@example.com' } });
    await waitFor(() => expect(email?.value).toBe('ada@example.com'));

    const beforeUnmount = container.textContent;
    app.unmount();
    expect(beforeUnmount).toContain('Checkout');
    expect(container.textContent).toBe('');
    container.remove();
  });

  it('navigates via the delegated document-level link handler on the not-found page', async () => {
    const { app, container } = await mountApp();
    await waitFor(() => expect(container.querySelector('.product-card')).not.toBeNull());

    window.history.pushState({}, '', '/does-not-exist');
    fireEvent.popState(window);
    await waitFor(() => expect(container.textContent).toContain('Page not found'));

    // not-found.ts's back link is a plain `<a href="/">` with no on:click
    // handler — only the delegated document-level action can intercept it.
    const backLink = container.querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(backLink).not.toBeNull();
    fireEvent.click(backLink!);
    await waitFor(() => expect(window.location.pathname).toBe('/'));

    app.unmount();
    container.remove();
  });

  it('can mount again after a complete teardown', async () => {
    const app = createApp();
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    document.body.append(firstContainer, secondContainer);

    await app.mount(firstContainer);
    await waitFor(() => expect(firstContainer.querySelectorAll('.product-card').length).toBeGreaterThan(0));
    app.unmount();

    await app.mount(secondContainer);
    await waitFor(() => expect(secondContainer.querySelectorAll('.product-card').length).toBeGreaterThan(0));
    expect(firstContainer.textContent).toBe('');

    app.unmount();
    firstContainer.remove();
    secondContainer.remove();
  });
});
