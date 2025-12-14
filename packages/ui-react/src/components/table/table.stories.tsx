import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';
import type { ColumnType } from '@web-loom/ui-core/table';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  location: string;
  status: string;
  lastActive: string;
  email: string;
};

const roles = ['Engineer', 'Designer', 'Product', 'Operations', 'Finance'];
const statuses = ['active', 'paused', 'offline', 'pending'];
const locations = ['New York', 'Austin', 'Berlin', 'London', 'Toronto'];
const teams = ['Platform', 'Growth', 'Product', 'Support'];

const baseColumns: ColumnType<TeamMember>[] = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    width: 200,
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    sorter: true,
    filters: roles.map((role) => ({ text: role, value: role.toLowerCase() })),
    width: 160,
  },
  {
    title: 'Team',
    dataIndex: 'team',
    key: 'team',
    width: 150,
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    sorter: true,
    width: 140,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    filters: statuses.map((status) => ({ text: status, value: status })),
    width: 120,
  },
  {
    title: 'Last Active',
    dataIndex: 'lastActive',
    key: 'lastActive',
    sorter: (a, b) => new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime(),
    render: (value: string) => new Date(value).toLocaleString(),
    width: 220,
  },
];

const sampleData: TeamMember[] = Array.from({ length: 80 }, (_, index) => {
  const id = `member-${index + 1}`;
  const name = `Member ${index + 1}`;
  return {
    id,
    name,
    role: roles[index % roles.length]!,
    team: teams[index % teams.length]!,
    location: locations[index % locations.length]!,
    status: statuses[index % statuses.length]!,
    lastActive: new Date(Date.now() - index * 2 * 60 * 1000).toISOString(),
    email: `${name.replace(/\s+/g, '').toLowerCase()}@weloom.dev`,
  };
});

const largeDataset: TeamMember[] = Array.from({ length: 220 }).map((_, index) => ({
  ...sampleData[index % sampleData.length]!,
  id: `row-${index + 1}`,
  name: `Contributor ${index + 1}`,
}));

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Basic: Story = {
  name: 'Basic',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={largeDataset}
      scroll={{ y: 360 }}
      pagination={{ pageSize: 10 }}
      rowKey="id"
    />
  ),
};

export const SortableColumns: Story = {
  name: 'Sortable Columns',
  render: () => <Table columns={baseColumns} dataSource={sampleData} rowKey="id" />,
};

export const FilterableData: Story = {
  name: 'Filterable Data',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={sampleData}
      rowKey="id"
      scroll={{ y: 400 }}
      pagination={{ pageSize: 5 }}
    />
  ),
};

export const Pagination: Story = {
  name: 'Pagination',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={sampleData}
      pagination={{ pageSize: 5, pageSizeOptions: [5, 10, 20], total: sampleData.length }}
      rowKey="id"
    />
  ),
};

export const RowSelection: Story = {
  name: 'Row Selection',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={sampleData}
      rowSelection={{
        mode: 'multiple',
        defaultSelectedRowKeys: ['member-1', 'member-3'],
      }}
      rowKey="id"
    />
  ),
};

export const ExpandableRows: Story = {
  name: 'Expandable Rows',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={sampleData}
      expandable={{
        expandedRowRender: (record) => (
          <div>
            <strong>Contact:</strong> {record.email}
            <br />
            <strong>Team:</strong> {record.team}
          </div>
        ),
      }}
      rowKey="id"
    />
  ),
};

export const FixedColumns: Story = {
  name: 'Fixed Columns',
  render: () => {
    const fixedColumns: ColumnType<TeamMember>[] = baseColumns.map((column) => {
      if (column.key === 'name' || column.key === 'role') {
        return { ...column, fixed: 'left' as const };
      }
      if (column.key === 'status') {
        return { ...column, fixed: 'right' as const };
      }
      return column;
    });
    return (
      <Table
        columns={fixedColumns}
        dataSource={largeDataset}
        scroll={{ x: 1200, y: 400 }}
        rowKey="id"
      />
    );
  },
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <Table
      columns={baseColumns}
      dataSource={[]}
      loading
      rowKey="id"
      pagination={{ pageSize: 5 }}
    />
  ),
};
