import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs } from './index';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        <div style={{ padding: '16px' }}>Content of Tab Pane 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2">
        <div style={{ padding: '16px' }}>Content of Tab Pane 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        <div style={{ padding: '16px' }}>Content of Tab Pane 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const CardType: Story = {
  render: () => (
    <Tabs type="card" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Card Tab 1">
        <div style={{ padding: '16px' }}>Content of Card Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Card Tab 2">
        <div style={{ padding: '16px' }}>Content of Card Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Card Tab 3">
        <div style={{ padding: '16px' }}>Content of Card Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const EditableCard: Story = {
  render: () => {
    const [tabs, setTabs] = useState([
      { key: '1', tab: 'Tab 1', content: 'Content of Tab 1' },
      { key: '2', tab: 'Tab 2', content: 'Content of Tab 2' },
      { key: '3', tab: 'Tab 3', content: 'Content of Tab 3' },
    ]);
    const [activeKey, setActiveKey] = useState('1');

    const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
      if (action === 'add') {
        const newKey = `${Date.now()}`;
        setTabs([...tabs, { key: newKey, tab: `New Tab`, content: `Content of New Tab` }]);
        setActiveKey(newKey);
      } else {
        const newTabs = tabs.filter((tab) => tab.key !== targetKey);
        setTabs(newTabs);
        if (activeKey === targetKey && newTabs.length > 0 && newTabs[0]) {
          setActiveKey(newTabs[0].key);
        }
      }
    };

    return (
      <Tabs
        type="editable-card"
        activeKey={activeKey}
        onChange={setActiveKey}
        onEdit={handleEdit}
      >
        {tabs.map((tab) => (
          <Tabs.TabPane key={tab.key} tabKey={tab.key} tab={tab.tab}>
            <div style={{ padding: '16px' }}>{tab.content}</div>
          </Tabs.TabPane>
        ))}
      </Tabs>
    );
  },
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        <div style={{ padding: '16px' }}>Content of Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2 (Disabled)" disabled>
        <div style={{ padding: '16px' }}>Content of Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        <div style={{ padding: '16px' }}>Content of Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const BottomPosition: Story = {
  render: () => (
    <Tabs tabPosition="bottom" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        <div style={{ padding: '16px' }}>Content of Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2">
        <div style={{ padding: '16px' }}>Content of Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        <div style={{ padding: '16px' }}>Content of Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const LeftPosition: Story = {
  render: () => (
    <Tabs tabPosition="left" defaultActiveKey="1" style={{ height: '220px' }}>
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        <div style={{ padding: '16px' }}>Content of Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2">
        <div style={{ padding: '16px' }}>Content of Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        <div style={{ padding: '16px' }}>Content of Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const RightPosition: Story = {
  render: () => (
    <Tabs tabPosition="right" defaultActiveKey="1" style={{ height: '220px' }}>
      <Tabs.TabPane tabKey="1" tab="Tab 1">
        <div style={{ padding: '16px' }}>Content of Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Tab 2">
        <div style={{ padding: '16px' }}>Content of Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Tab 3">
        <div style={{ padding: '16px' }}>Content of Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Tabs size="small" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Small Tab 1">
        <div style={{ padding: '16px' }}>Content of Small Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Small Tab 2">
        <div style={{ padding: '16px' }}>Content of Small Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Small Tab 3">
        <div style={{ padding: '16px' }}>Content of Small Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <Tabs size="large" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Large Tab 1">
        <div style={{ padding: '16px' }}>Content of Large Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Large Tab 2">
        <div style={{ padding: '16px' }}>Content of Large Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Large Tab 3">
        <div style={{ padding: '16px' }}>Content of Large Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const ControlledTabs: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => setActiveKey('1')}>Activate Tab 1</button>{' '}
          <button onClick={() => setActiveKey('2')}>Activate Tab 2</button>{' '}
          <button onClick={() => setActiveKey('3')}>Activate Tab 3</button>
        </div>
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          <Tabs.TabPane tabKey="1" tab="Tab 1">
            <div style={{ padding: '16px' }}>Content of Tab 1</div>
          </Tabs.TabPane>
          <Tabs.TabPane tabKey="2" tab="Tab 2">
            <div style={{ padding: '16px' }}>Content of Tab 2</div>
          </Tabs.TabPane>
          <Tabs.TabPane tabKey="3" tab="Tab 3">
            <div style={{ padding: '16px' }}>Content of Tab 3</div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  },
};

export const CardWithBottomPosition: Story = {
  render: () => (
    <Tabs type="card" tabPosition="bottom" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Card Tab 1">
        <div style={{ padding: '16px' }}>Content of Card Tab 1</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Card Tab 2">
        <div style={{ padding: '16px' }}>Content of Card Tab 2</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Card Tab 3">
        <div style={{ padding: '16px' }}>Content of Card Tab 3</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab={<span>🏠 Home</span>}>
        <div style={{ padding: '16px' }}>Home content</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab={<span>⚙️ Settings</span>}>
        <div style={{ padding: '16px' }}>Settings content</div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab={<span>👤 Profile</span>}>
        <div style={{ padding: '16px' }}>Profile content</div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const WithComplexContent: Story = {
  render: () => (
    <Tabs type="card" defaultActiveKey="1">
      <Tabs.TabPane tabKey="1" tab="Article">
        <div style={{ padding: '24px' }}>
          <h2>Article Title</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident.
          </p>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="2" tab="Comments">
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong>User1:</strong> Great article!
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>User2:</strong> Very informative, thanks for sharing.
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>User3:</strong> Looking forward to more content like this.
          </div>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tabKey="3" tab="Related">
        <div style={{ padding: '24px' }}>
          <ul>
            <li>Related Article 1</li>
            <li>Related Article 2</li>
            <li>Related Article 3</li>
          </ul>
        </div>
      </Tabs.TabPane>
    </Tabs>
  ),
};

export const EditableWithNonClosableTabs: Story = {
  render: () => {
    const [tabs, setTabs] = useState([
      { key: '1', tab: 'Home', content: 'Home Content (Non-closable)', closable: false },
      { key: '2', tab: 'Tab 2', content: 'Content of Tab 2', closable: true },
      { key: '3', tab: 'Tab 3', content: 'Content of Tab 3', closable: true },
    ]);
    const [activeKey, setActiveKey] = useState('1');

    const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
      if (action === 'add') {
        const newKey = `${Date.now()}`;
        setTabs([
          ...tabs,
          { key: newKey, tab: `New Tab`, content: `Content of New Tab`, closable: true },
        ]);
        setActiveKey(newKey);
      } else {
        const newTabs = tabs.filter((tab) => tab.key !== targetKey);
        setTabs(newTabs);
        if (activeKey === targetKey && newTabs.length > 0 && newTabs[0]) {
          setActiveKey(newTabs[0].key);
        }
      }
    };

    return (
      <Tabs
        type="editable-card"
        activeKey={activeKey}
        onChange={setActiveKey}
        onEdit={handleEdit}
      >
        {tabs.map((tab) => (
          <Tabs.TabPane
            key={tab.key}
            tabKey={tab.key}
            tab={tab.tab}
            closable={tab.closable}
          >
            <div style={{ padding: '16px' }}>{tab.content}</div>
          </Tabs.TabPane>
        ))}
      </Tabs>
    );
  },
};

export const ApplicationInterface: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('dashboard');

    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: 'var(--color-neutral-gray-50, #f9fafb)',
          minHeight: '400px',
        }}
      >
        <h1 style={{ marginBottom: '24px', color: 'var(--color-neutral-gray-900, #111827)' }}>
          Application Dashboard
        </h1>
        <Tabs type="card" activeKey={activeKey} onChange={setActiveKey}>
          <Tabs.TabPane tabKey="dashboard" tab="📊 Dashboard">
            <div style={{ padding: '24px', backgroundColor: 'white', minHeight: '200px' }}>
              <h2>Dashboard Overview</h2>
              <p>View your application metrics and statistics here.</p>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tabKey="analytics" tab="📈 Analytics">
            <div style={{ padding: '24px', backgroundColor: 'white', minHeight: '200px' }}>
              <h2>Analytics</h2>
              <p>Detailed analytics and reports.</p>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tabKey="settings" tab="⚙️ Settings">
            <div style={{ padding: '24px', backgroundColor: 'white', minHeight: '200px' }}>
              <h2>Settings</h2>
              <p>Configure your application settings.</p>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tabKey="help" tab="❓ Help">
            <div style={{ padding: '24px', backgroundColor: 'white', minHeight: '200px' }}>
              <h2>Help Center</h2>
              <p>Find answers to common questions.</p>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  },
};

export const DocumentEditor: Story = {
  render: () => {
    const [tabs, setTabs] = useState([
      { key: '1', tab: 'Document 1.txt', content: 'Content of Document 1' },
      { key: '2', tab: 'Document 2.txt', content: 'Content of Document 2' },
      { key: '3', tab: 'Untitled.txt', content: '' },
    ]);
    const [activeKey, setActiveKey] = useState('1');

    const handleEdit = (targetKey: string, action: 'add' | 'remove') => {
      if (action === 'add') {
        const newKey = `${Date.now()}`;
        setTabs([
          ...tabs,
          { key: newKey, tab: `Untitled-${newKey}.txt`, content: '' },
        ]);
        setActiveKey(newKey);
      } else {
        const newTabs = tabs.filter((tab) => tab.key !== targetKey);
        setTabs(newTabs);
        if (activeKey === targetKey && newTabs.length > 0 && newTabs[0]) {
          setActiveKey(newTabs[0].key);
        }
      }
    };

    return (
      <div style={{ border: '1px solid var(--color-neutral-gray-200, #e5e7eb)' }}>
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--color-neutral-gray-200, #e5e7eb)',
            backgroundColor: 'var(--color-neutral-gray-50, #f9fafb)',
          }}
        >
          <strong>Text Editor</strong>
        </div>
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={setActiveKey}
          onEdit={handleEdit}
          style={{ margin: 0 }}
        >
          {tabs.map((tab) => (
            <Tabs.TabPane key={tab.key} tabKey={tab.key} tab={tab.tab}>
              <textarea
                defaultValue={tab.content}
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '16px',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
                placeholder="Start typing..."
              />
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    );
  },
};
