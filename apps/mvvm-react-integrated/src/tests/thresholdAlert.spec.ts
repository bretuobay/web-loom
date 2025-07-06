import { describe, it, expect } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';

describe('Threshold Alert List', () => {
  it('should display threshold alerts for a greenhouse', async () => {
    // Navigate to Alpha Greenhouse alerts
    // This assumes there's a way to navigate to the alerts page/section for Alpha Greenhouse.
    // This might involve clicking on "Alpha Greenhouse" and then an "Alerts" tab or button.
    // For now, let's assume direct navigation or a clear link is available.
    // We might need to adjust this based on the app's navigation flow.
    // Let's assume clicking the greenhouse name takes you to a page
    // where alerts are visible or can be navigated to.
    await userEvent.click(page.getByText('Alpha Greenhouse'));

    // Check for Alpha Greenhouse alerts
    // This assumes the alert information is displayed as text.
    // The selectors might need to be more specific.
    expect(await page.locator('text="temperature"').locator('text="18"').locator('text="28"').isVisible()).toBe(true);
    expect(await page.locator('text="humidity"').locator('text="60"').locator('text="75"').isVisible()).toBe(true);
  });
});
