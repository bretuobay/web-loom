import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    count: {
      control: 'number',
      description: 'Number to show in badge',
    },
    dot: {
      control: 'boolean',
      description: 'Show a red dot instead of count',
    },
    showZero: {
      control: 'boolean',
      description: 'Whether to display a zero count',
    },
    overflowCount: {
      control: 'number',
      description: 'Max count to show',
    },
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Size of the badge',
    },
    status: {
      control: 'select',
      options: ['success', 'processing', 'default', 'error', 'warning'],
      description: 'Set badge as a status dot',
    },
    color: {
      control: 'color',
      description: 'Custom badge color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Helper component for demos
const DemoBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 48,
      height: 48,
      backgroundColor: '#f0f0f0',
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

// Basic Examples
export const Basic: Story = {
  args: {
    count: 5,
    children: <DemoBox>📧</DemoBox>,
  },
};

export const Dot: Story = {
  args: {
    dot: true,
    children: <DemoBox>🔔</DemoBox>,
  },
};

export const ShowZero: Story = {
  args: {
    count: 0,
    showZero: true,
    children: <DemoBox>📬</DemoBox>,
  },
};

export const Overflow: Story = {
  args: {
    count: 100,
    overflowCount: 99,
    children: <DemoBox>💬</DemoBox>,
  },
};

// Size Variations
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <Badge count={5} size="small">
        <DemoBox>Small</DemoBox>
      </Badge>
      <Badge count={5} size="default">
        <DemoBox>Default</DemoBox>
      </Badge>
    </div>
  ),
};

// Status Badges
export const StatusBadges: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Badge status="success" text="Success" />
      <Badge status="processing" text="Processing" />
      <Badge status="default" text="Default" />
      <Badge status="error" text="Error" />
      <Badge status="warning" text="Warning" />
    </div>
  ),
};

// Count Variations
export const CountVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <Badge count={0}>
        <DemoBox>0</DemoBox>
      </Badge>
      <Badge count={0} showZero>
        <DemoBox>0+</DemoBox>
      </Badge>
      <Badge count={1}>
        <DemoBox>1</DemoBox>
      </Badge>
      <Badge count={9}>
        <DemoBox>9</DemoBox>
      </Badge>
      <Badge count={10}>
        <DemoBox>10</DemoBox>
      </Badge>
      <Badge count={99}>
        <DemoBox>99</DemoBox>
      </Badge>
      <Badge count={100}>
        <DemoBox>99+</DemoBox>
      </Badge>
      <Badge count={1000}>
        <DemoBox>999+</DemoBox>
      </Badge>
    </div>
  ),
};

// Offset Examples
export const WithOffset: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 64, alignItems: 'center' }}>
      <Badge count={5} offset={[0, 0]}>
        <DemoBox>Default</DemoBox>
      </Badge>
      <Badge count={5} offset={[10, -10]}>
        <DemoBox>Offset</DemoBox>
      </Badge>
      <Badge dot offset={[-5, 5]}>
        <DemoBox>Dot</DemoBox>
      </Badge>
    </div>
  ),
};

// Custom Colors
export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <Badge count={5} color="#52c41a">
        <DemoBox>Green</DemoBox>
      </Badge>
      <Badge count={5} color="#1890ff">
        <DemoBox>Blue</DemoBox>
      </Badge>
      <Badge count={5} color="#faad14">
        <DemoBox>Orange</DemoBox>
      </Badge>
      <Badge count={5} color="#722ed1">
        <DemoBox>Purple</DemoBox>
      </Badge>
    </div>
  ),
};

// Standalone Badges
export const Standalone: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Badge count={5} />
      <Badge count={10} />
      <Badge count={99} />
      <Badge count={100} />
      <Badge count="New" />
      <Badge count="HOT" color="#ff4d4f" />
    </div>
  ),
};

// Dynamic Count with Animation
export const DynamicCount: Story = {
  render: () => {
    const [count, setCount] = useState(0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <Badge count={count}>
          <DemoBox>📬</DemoBox>
        </Badge>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setCount(0)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
        <p style={{ fontSize: 14, color: '#666' }}>Current count: {count}</p>
      </div>
    );
  },
};

// Real-world Examples
export const Notifications: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <Badge count={12}>
        <button
          type="button"
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          🔔
        </button>
      </Badge>
      <Badge dot>
        <button
          type="button"
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          📧
        </button>
      </Badge>
      <Badge count={99}>
        <button
          type="button"
          style={{
            padding: '8px 16px',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          💬
        </button>
      </Badge>
    </div>
  ),
};

export const UserAvatar: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <Badge dot>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#1890ff',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          JD
        </div>
      </Badge>
      <Badge count={5}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#52c41a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          AB
        </div>
      </Badge>
      <Badge status="processing">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#faad14',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          CD
        </div>
      </Badge>
    </div>
  ),
};

// Complex Example
export const ComplexExample: Story = {
  render: () => {
    const [messages, setMessages] = useState(5);
    const [notifications, setNotifications] = useState(12);

    return (
      <div
        style={{
          padding: 24,
          background: '#f5f5f5',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
          <Badge count={messages}>
            <button
              type="button"
              style={{
                padding: '12px 24px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={() => setMessages(0)}
            >
              Messages
            </button>
          </Badge>
          <Badge count={notifications} overflowCount={9}>
            <button
              type="button"
              style={{
                padding: '12px 24px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={() => setNotifications(0)}
            >
              Notifications
            </button>
          </Badge>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Badge status="processing" text="Processing" />
          <Badge status="success" text="All systems operational" />
          <Badge status="warning" text="High memory usage" />
        </div>
      </div>
    );
  },
};
