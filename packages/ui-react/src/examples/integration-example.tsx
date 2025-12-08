/**
 * Example demonstrating integration of @web-loom/ui-core and @web-loom/ui-patterns
 * with @repo/ui-react components
 */

import { useEffect, useState } from 'react';
import { createDialogBehavior } from '@web-loom/ui-core';
import { createMasterDetail } from '@web-loom/ui-patterns';
import { Button } from '../components/button';
import { Card } from '../components/card';

interface Item {
  id: string;
  name: string;
  description: string;
}

/**
 * Example component using ui-core dialog behavior
 */
export function DialogExample() {
  const [dialog] = useState(() =>
    createDialogBehavior({
      id: 'example-dialog',
      onOpen: () => console.log('Dialog opened'),
      onClose: () => console.log('Dialog closed'),
    })
  );

  const [state, setState] = useState(dialog.getState());

  useEffect(() => {
    const unsubscribe = dialog.subscribe(setState);
    return unsubscribe;
  }, [dialog]);

  return (
    <div>
      <Button onClick={() => dialog.actions.open({ title: 'Example Dialog' })}>
        Open Dialog
      </Button>

      {state.isOpen && (
        <div role="dialog" aria-modal="true" style={{ padding: '20px' }}>
          <Card title="Example Dialog">
            <p>This is an example dialog using @web-loom/ui-core</p>
            <Button onClick={() => dialog.actions.close()}>Close</Button>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Example component using ui-patterns master-detail
 */
export function MasterDetailExample() {
  const items: Item[] = [
    { id: '1', name: 'Item 1', description: 'Description for item 1' },
    { id: '2', name: 'Item 2', description: 'Description for item 2' },
    { id: '3', name: 'Item 3', description: 'Description for item 3' },
  ];

  const [masterDetail] = useState(() =>
    createMasterDetail({
      items,
      getId: (item: Item) => item.id,
      onSelectionChange: (item: Item | null) => {
        console.log('Selected:', item);
      },
    })
  );

  const [state, setState] = useState(masterDetail.getState());

  useEffect(() => {
    const unsubscribe = masterDetail.subscribe(setState);
    return unsubscribe;
  }, [masterDetail]);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <aside style={{ width: '200px' }}>
        <h3>Items</h3>
        {state.items.map((item) => (
          <Button
            key={item.id}
            onClick={() => masterDetail.actions.selectItem(item)}
            variant={state.selectedItem?.id === item.id ? 'primary' : 'secondary'}
          >
            {item.name}
          </Button>
        ))}
      </aside>

      <main style={{ flex: 1 }}>
        <h3>Details</h3>
        {state.selectedItem && (
          <Card title={state.selectedItem.name}>
            <p>{state.selectedItem.description}</p>
          </Card>
        )}
      </main>
    </div>
  );
}

/**
 * Combined example showing both patterns working together
 */
export function IntegrationExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Web Loom UI Integration Example</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Dialog Behavior (from @web-loom/ui-core)</h2>
        <DialogExample />
      </section>

      <section>
        <h2>Master-Detail Pattern (from @web-loom/ui-patterns)</h2>
        <MasterDetailExample />
      </section>
    </div>
  );
}
