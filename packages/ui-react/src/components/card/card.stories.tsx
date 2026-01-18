import type { Meta, StoryObj } from '@storybook/react';
import { Card, type CardProps } from './card';

const meta: Meta<CardProps> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    title: 'Design tokens',
    description: 'Explore border, color and typography primitives.',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Size of the card',
    },
    bordered: {
      control: 'boolean',
      description: 'Whether to show border',
    },
    hoverable: {
      control: 'boolean',
      description: 'Whether card is hoverable',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading skeleton',
    },
  },
};

export default meta;
type Story = StoryObj<CardProps>;

/**
 * Default card with title and description
 */
export const Default: Story = {};

/**
 * Card with badge and footer content
 */
export const WithBadgeAndFooter: Story = {
  args: {
    badge: 'Beta',
    footer: (
      <>
        Explore primitives <span aria-hidden="true">→</span>
      </>
    ),
  },
};

/**
 * Card rendered as a link (anchor tag)
 */
export const AsLink: Story = {
  args: {
    href: 'https://example.com/design',
    footer: 'Opens in a new tab',
  },
};

/**
 * Card with extra content in header (e.g., buttons, icons)
 */
export const WithExtra: Story = {
  args: {
    title: 'Card Settings',
    description: 'Configure your card preferences and options.',
    extra: <button style={{ padding: '4px 12px', cursor: 'pointer' }}>⚙️ Settings</button>,
  },
};

/**
 * Card without border
 */
export const NoBorder: Story = {
  args: {
    title: 'Borderless Card',
    description: 'This card has no border, only a shadow.',
    bordered: false,
  },
};

/**
 * Non-hoverable card (no lift effect on hover)
 */
export const NonHoverable: Story = {
  args: {
    title: 'Static Card',
    description: 'This card does not have hover effects.',
    hoverable: false,
  },
};

/**
 * Small size card
 */
export const Small: Story = {
  args: {
    title: 'Small Card',
    description: 'This is a small card with reduced padding.',
    size: 'small',
  },
};

/**
 * Card with loading skeleton
 */
export const Loading: Story = {
  args: {
    title: 'Loading Card',
    description: 'This content is being loaded...',
    loading: true,
  },
};

/**
 * Card with cover image
 */
export const WithCover: Story = {
  args: {
    title: 'Beautiful Landscape',
    description: 'A stunning view of mountains and valleys at sunset.',
    cover: (
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
        alt="Mountain landscape"
        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
      />
    ),
    badge: 'Featured',
  },
};

/**
 * Card with action buttons
 */
export const WithActions: Story = {
  args: {
    title: 'User Profile',
    description: 'Manage your account settings and preferences.',
    actions: [
      <button key="edit" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        ✏️ Edit
      </button>,
      <button key="share" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        🔗 Share
      </button>,
      <button key="delete" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        🗑️ Delete
      </button>,
    ],
  },
};

/**
 * Complex card with all features combined
 */
export const ComplexCard: Story = {
  args: {
    title: 'Project Dashboard',
    description: 'Track your project progress and team collaboration in real-time.',
    badge: 'Premium',
    extra: <span style={{ color: '#10b981', fontWeight: 'bold' }}>● Active</span>,
    cover: (
      <div
        style={{
          width: '100%',
          height: '150px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        📊 Analytics
      </div>
    ),
    footer: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Last updated: 2 hours ago</span>
        <span>👥 12 members</span>
      </div>
    ),
    actions: [
      <button key="view" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        👁️ View
      </button>,
      <button key="report" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        📈 Report
      </button>,
    ],
  },
};

/**
 * Card grid layout example
 */
export const CardGrid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '900px' }}>
      <Card title="Analytics" description="View your analytics dashboard" badge="New" footer="View details →" />
      <Card title="Reports" description="Generate and export reports" size="small" footer="Generate →" />
      <Card title="Settings" description="Configure your preferences" hoverable={false} footer="Configure →" />
    </div>
  ),
};

/**
 * Card without title
 */
export const WithoutTitle: Story = {
  args: {
    title: undefined,
    description: 'A card can have description and children without a title.',
    footer: 'Learn more →',
  },
};

/**
 * Card with ReactNode title
 */
export const CustomTitle: Story = {
  args: {
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>🎨</span>
        <span>Custom Title Component</span>
      </div>
    ),
    description: 'Title can be any React node, not just a string.',
  },
};
