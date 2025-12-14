import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import { List } from './List';

const basicItems = ['Design tokens', 'Layout system', 'Atoms library', 'Accessibility guidance'];

const actionItems = [
  { title: 'Quarterly roadmap review', due: 'Due Oct 14', status: 'High priority' },
  { title: 'Component QA round', due: 'Due Oct 17', status: 'Needs review' },
  { title: 'Release notes prep', due: 'Due Oct 21', status: 'On track' },
];

const gridItems = [
  { title: 'Analytics dashboard', owner: 'Ada Lovelace', description: 'Realtime metrics and alerts' },
  { title: 'Content hub', owner: 'Grace Hopper', description: 'Article library and editorial tools' },
  { title: 'Billing portal', owner: 'Katherine Johnson', description: 'Subscriptions and invoices' },
  { title: 'Support queue', owner: 'Mary Jackson', description: 'Priority inbox for customers' },
  { title: 'Design system', owner: 'Radia Perlman', description: 'Patterns, tokens, and docs' },
];

const roster = [
  {
    id: 'member-1',
    name: 'Ada Lovelace',
    role: 'Design Lead',
    description: 'Guides the visual language and accessibility review.',
    avatar: 'AL',
  },
  {
    id: 'member-2',
    name: 'Grace Hopper',
    role: 'Engineering Manager',
    description: 'Owns the core layout system and grid tooling.',
    avatar: 'GH',
  },
  {
    id: 'member-3',
    name: 'Katherine Johnson',
    role: 'Product Strategy',
    description: 'Defines success metrics and experimentation plans.',
    avatar: 'KJ',
  },
];

const meta: Meta<typeof List> = {
  title: 'Components/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof List>;

export const Basic: Story = {
  render: () => (
    <List header="Team checklist" footer="4 items" bordered>
      {basicItems.map((item) => (
        <List.Item key={item}>{item}</List.Item>
      ))}
    </List>
  ),
};

export const WithActions: Story = {
  render: () => (
    <List header="Operations" footer="3 active tasks" bordered>
      {actionItems.map((entry) => (
        <List.Item
          key={entry.title}
          actions={[
            <button key="edit" type="button">
              Edit
            </button>,
            <button key="archive" type="button">
              Archive
            </button>,
          ]}
          extra={entry.due}
        >
          <strong>{entry.title}</strong>
          <p>{entry.status}</p>
        </List.Item>
      ))}
    </List>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <List
      grid={{ column: 3, gutter: 16 }}
      header="Project highlights"
      loading={false}
      split={false}
      dataSource={gridItems}
      renderItem={(item) => (
        <List.Item>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
          <span>Owner: {item.owner}</span>
        </List.Item>
      )}
    />
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <List header="Syncing workspaces" loading pagination={false} bordered>
      <List.Item>Content will appear once sync completes.</List.Item>
    </List>
  ),
};

export const Pagination: Story = {
  render: () => {
    const dataset = useMemo(() => Array.from({ length: 18 }, (_, idx) => `Item ${idx + 1}`), []);
    return (
      <List
        dataSource={dataset}
        pagination={{
          pageSize: 6,
          total: dataset.length,
          pageSizeOptions: [6, 9, 12],
        }}
        header="Paginated feed"
        footer="Page navigation"
      />
    );
  },
};

export const CustomRenderItem: Story = {
  render: () => (
    <List
      dataSource={roster}
      rowKey="id"
      renderItem={(member) => (
        <List.Item>
          <List.Item.Meta
            avatar={<div style={{ width: 40, height: 40, background: '#2563eb', color: '#fff', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{member.avatar}</div>}
            title={member.name}
            description={member.role}
          />
          <p>{member.description}</p>
        </List.Item>
      )}
      header="Roster"
      footer="Structured metadata"
    />
  ),
};
