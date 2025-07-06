import { describe, it, expect } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';

describe('Greenhouse List', () => {
  it('should display the simplified app content', async () => {
    // Check for content from the simplified App.tsx
    await expect.element(page.getByText('Hello Test')).toBeVisible();
    await expect.element(page.getByText('If you see this, the basic app render is working.')).toBeVisible();
  });
});
