That's a great topic! User Interface (UI) interactions at the page level are often called **Page Patterns** or **Layout Patterns**. They define how major components relate to each other and how content is displayed and navigated.

Here is a list of common and effective page-level UI interaction patterns:

## 🧭 Page-Level UI Interaction Patterns

---

### 1. **Navigation and Structure**

These patterns focus on how users move between different views and sections.

- **Side Bar to Page (or "App Shell" Pattern):**
  - **Description:** A persistent, static navigation pane (**Sidebar**) remains visible on the left (or sometimes right) while the main content area (**Page**) changes based on the user's selection in the sidebar.
  - **Interaction:** Clicking a link in the sidebar immediately loads the new content into the main page area.
  - **Use Case:** Dashboards, settings panels, web applications with many top-level sections (e.g., Slack, GitHub).

- **Fixed Header/Footer:**
  - **Description:** The primary navigation (Header) and/or secondary links/legal info (Footer) remain fixed while the main content scrolls underneath.
  - **Interaction:** Scroll interaction. The primary interaction is providing persistent access to global actions (e.g., search, user profile, brand logo).
  - **Use Case:** Nearly all modern websites and web apps.

- **Hub and Spoke:**
  - **Description:** A central "Hub" page (e.g., a homepage or dashboard) serves as the entry point to several independent "Spoke" pages or sections.
  - **Interaction:** Linear navigation from the Hub to a Spoke, often requiring the user to return to the Hub to switch to a different Spoke.
  - **Use Case:** Marketing sites, complex task flows.

---

### 2. **Content Display and Manipulation**

These patterns govern how large amounts of data are presented and managed.

- **Master List / Table to Detail:**
  - **Description:** A **Master View** (a list, table, or grid of items) is shown on one side, and when an item is selected, its full context or properties are displayed in a **Detail View** on the other side.
  - **Interaction:** Clicking an item in the Master View updates the adjacent Detail View without leaving the page.
  - **Use Case:** Email clients (inbox and message body), file explorers (file list and preview pane), CRM records.

- **Collapsible/Expandable Content:**
  - **Description:** Large sections of content are initially hidden or summarized (e.g., in an **Accordion** or **Disclosure Widget**) and can be revealed on demand.
  - **Interaction:** Clicking a header/button toggles the visibility of the associated content section.
  - **Use Case:** FAQs, product specification sheets, multi-step forms.

- **Tabbed Interface:**
  - **Description:** Content is organized into separate, mutually exclusive panes, with navigation controls (**Tabs**) displayed prominently (usually at the top).
  - **Interaction:** Clicking a tab immediately replaces the currently visible content pane with the content of the selected tab.
  - **Use Case:** Settings screens, profiles, product pages with different information categories (e.g., Description, Specs, Reviews).

---

### 3. **Focused Interaction and Flow**

These patterns temporarily change the page state to focus the user on a specific task or piece of information.

- **Modal/Dialog Window:**
  - **Description:** A small, focused window that appears above the main page content, often with a semi-transparent overlay (**Backdrop**) that locks the user's focus until the dialog is closed.
  - **Interaction:** User must interact with or close the dialog before continuing to interact with the underlying page.
  - **Use Case:** Critical alerts, short forms (e.g., login, confirming a delete action), image lightboxes.

- **Floating Action Button (FAB):**
  - **Description:** A prominent, usually circular, button that rests above the main page content (often in a corner) and represents the primary or most frequent action on that screen.
  - **Interaction:** Clicking the FAB initiates a key action, often opening a form, a modal, or a sub-menu.
  - **Use Case:** Mobile and modern web applications for creating new items (e.g., a "New Email" button).

- **Wizard/Step-by-Step Flow:**
  - **Description:** A complex process (like setup or checkout) is broken down into a linear sequence of pages or screens, often with a visible progress indicator.
  - **Interaction:** Clicking "Next" or "Continue" saves the current input and transitions to the next step, without allowing the user to skip steps.
  - **Use Case:** E-commerce checkout, account sign-up, software installation.
