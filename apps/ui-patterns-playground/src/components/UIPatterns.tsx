import { useState } from 'react';
import {
  DialogExample,
  ListSelectionExample,
  MasterDetailExample,
  WizardExample,
  TextEditorExample,
  CommandPaletteExample,
  KanbanBoardExample,
  PhotoGalleryExample,
  SettingsInterfaceExample,
  ScrollAwareFABExample,
  HubAndSpokeExample,
} from './examples';
import './UIPatterns.css';

/**
 * Main page showcasing all UI Core and UI Patterns examples
 */
export function UIPatterns() {
  const [activeExample, setActiveExample] = useState<string>('dialog');

  const examples = [
    { id: 'dialog', label: 'Dialog Behavior', component: DialogExample },
    {
      id: 'list-selection',
      label: 'List Selection',
      component: ListSelectionExample,
    },
    {
      id: 'master-detail',
      label: 'Master-Detail Pattern',
      component: MasterDetailExample,
    },
    { id: 'wizard', label: 'Wizard Pattern', component: WizardExample },
    { id: 'text-editor', label: 'Text Editor (Undo/Redo)', component: TextEditorExample },
    { id: 'command-palette', label: 'Command Palette (Shortcuts)', component: CommandPaletteExample },
    { id: 'kanban-board', label: 'Kanban Board (Drag-Drop)', component: KanbanBoardExample },
    { id: 'photo-gallery', label: 'Photo Gallery (Grid)', component: PhotoGalleryExample },
    { id: 'settings', label: 'Settings (Hub & Spoke)', component: SettingsInterfaceExample },
    { id: 'hub-and-spoke', label: 'Hub and Spoke', component: HubAndSpokeExample },
    { id: 'scroll-fab', label: 'Scroll-Aware FAB', component: ScrollAwareFABExample },
  ];

  const ActiveComponent = examples.find((ex) => ex.id === activeExample)?.component || DialogExample;

  return (
    <div className="ui-patterns-page">
      <div className="ui-patterns-header">
        <h1>UI Core & Patterns Examples</h1>
        <p>Interactive examples demonstrating @web-loom/ui-core behaviors and @web-loom/ui-patterns</p>
      </div>

      <div className="ui-patterns-layout">
        <nav className="ui-patterns-nav">
          <h3>Examples</h3>
          <ul>
            {examples.map((example) => (
              <li key={example.id}>
                <button
                  className={`nav-button ${activeExample === example.id ? 'active' : ''}`}
                  onClick={() => setActiveExample(example.id)}
                >
                  {example.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="ui-patterns-content">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
