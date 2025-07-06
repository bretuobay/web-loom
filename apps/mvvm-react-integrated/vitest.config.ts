import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true, // Run Playwright in headless mode
      testerHtmlPath: './index.html', // Specify the HTML entry point
      instances: [
        {
          browser: 'chromium',
          // You can add launch options here if needed
          // launch: {},
          context: {
            // Log browser console messages
            onConsoleMessage: async (msg: any) => { // Use 'any' for now, should be playwright.ConsoleMessage
              const type = msg.type();
              const text = msg.text();
              const args = [];
              try {
                for (const arg of msg.args()) {
                  args.push(await arg.jsonValue());
                }
              } catch (e) {
                // Some args might not be serializable or might have been disposed
              }
              console.log(`[Browser Console] ${type.toUpperCase()}: ${text}`, ...args);
            },
          },
        },
      ],
    },
  },
});
