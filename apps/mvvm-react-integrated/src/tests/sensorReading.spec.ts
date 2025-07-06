import { describe, it, expect } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';

describe('Sensor Reading List', () => {
  it('should display sensor readings for a sensor', async () => {
    // Navigate to Alpha Greenhouse
    await userEvent.click(page.getByText('Alpha Greenhouse'));

    // Navigate to the first temperature sensor
    // This assumes a clickable element for the sensor.
    // Adjust selector based on actual implementation.
    await userEvent.click(page.getByText('temperature').first());

    // Check for the presence of 5 reading entries.
    // This assumes readings are displayed in a way that can be counted,
    // e.g., each reading is a list item or a card.
    // We'll look for a common class or element type.
    // For now, let's assume each reading has a 'reading-value' class.
    // This selector will need to be updated based on the actual DOM structure.
    const readings = await page.locator('.reading-value').count();
    expect(readings).toBe(5);
  });
});
