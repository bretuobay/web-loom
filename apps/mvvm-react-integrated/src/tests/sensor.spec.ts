import { describe, it, expect } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';

describe('Sensor List', () => {
  it('should display the list of sensors for a greenhouse', async () => {
    // Navigate to Alpha Greenhouse sensors
    // This assumes there's a clickable element with the text "Alpha Greenhouse"
    // that navigates to the sensor list. This might need adjustment based on actual app structure.
    await userEvent.click(page.getByText('Alpha Greenhouse'));

    // Check for sensors in Alpha Greenhouse
    // These checks might need to be more specific if there are multiple sensors of the same type
    await expect.element(page.getByText('temperature')).toBeVisible();
    await expect.element(page.getByText('humidity')).toBeVisible();
    await expect.element(page.getByText('soilMoisture')).toBeVisible();
    await expect.element(page.getByText('lightIntensity')).toBeVisible();

    // Check sensor statuses (assuming status is displayed alongside the type)
    // This will require knowing how the status is displayed (e.g., "temperature (active)")
    // For now, let's assume a simple text search and count occurrences.
    // Vitest's Locator doesn't have a direct count() that returns a number for expect.
    // We can use .all() to get an array of locators and check its length.
    expect((await page.getByText('active').all()).length).toBeGreaterThanOrEqual(3);
    expect((await page.getByText('inactive').all()).length).toBeGreaterThanOrEqual(1);
  });
});
