/**
 * Button Component Stories
 *
 * Demonstrates all Button variants, sizes, shapes, and states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button, type ButtonProps } from './Button';

// Mock icons for demonstration
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2v10m0 0l-3-3m3 3l3-3M2 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="2" fill="currentColor" />
    <path d="M8 1v2m0 10v2M1 8h2m10 0h2M3.5 3.5l1.4 1.4m6.2 6.2l1.4 1.4M3.5 12.5l1.4-1.4m6.2-6.2l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const meta: Meta<ButtonProps> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'dashed', 'link', 'text'],
      description: 'Button type/variant',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Button size',
    },
    shape: {
      control: 'select',
      options: ['default', 'circle', 'round'],
      description: 'Button shape',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    danger: {
      control: 'boolean',
      description: 'Danger/destructive action styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    block: {
      control: 'boolean',
      description: 'Make button full width',
    },
    onClick: { action: 'clicked' },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

// ========== Variant Stories ==========

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Button',
  },
};

export const Dashed: Story = {
  args: {
    variant: 'dashed',
    children: 'Dashed Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Text Button',
  },
};

// ========== Size Stories ==========

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="middle">Middle</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

// ========== Shape Stories ==========

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button shape="default">Default</Button>
      <Button shape="round">Round</Button>
    </div>
  ),
};

// ========== State Stories ==========

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Button variant="primary" loading>
        Primary Loading
      </Button>
      <Button variant="default" loading>
        Default Loading
      </Button>
      <Button variant="dashed" loading>
        Dashed Loading
      </Button>
      <Button variant="link" loading>
        Link Loading
      </Button>
      <Button variant="text" loading>
        Text Loading
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Button variant="primary" disabled>
        Primary Disabled
      </Button>
      <Button variant="default" disabled>
        Default Disabled
      </Button>
      <Button variant="dashed" disabled>
        Dashed Disabled
      </Button>
      <Button variant="link" disabled>
        Link Disabled
      </Button>
      <Button variant="text" disabled>
        Text Disabled
      </Button>
    </div>
  ),
};

// ========== Danger Stories ==========

export const DangerButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Button variant="primary" danger>
        Delete
      </Button>
      <Button variant="default" danger>
        Remove
      </Button>
      <Button variant="dashed" danger>
        Clear
      </Button>
      <Button variant="link" danger>
        Unsubscribe
      </Button>
      <Button variant="text" danger>
        Cancel
      </Button>
    </div>
  ),
};

// ========== Icon Stories ==========

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Button variant="primary" icon={<IconPlus />}>
        Add Item
      </Button>
      <Button variant="default" icon={<IconDownload />}>
        Download
      </Button>
      <Button variant="dashed" icon={<IconSettings />}>
        Settings
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button variant="primary" icon={<IconPlus />} />
      <Button variant="default" icon={<IconDownload />} />
      <Button variant="text" icon={<IconSettings />} />
    </div>
  ),
};

export const CircleIconButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button shape="circle" icon={<IconPlus />} size="small" />
      <Button shape="circle" icon={<IconDownload />} size="middle" />
      <Button shape="circle" icon={<IconSettings />} size="large" />
    </div>
  ),
};

// ========== Block Story ==========

export const Block: Story = {
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    block: true,
  },
  parameters: {
    layout: 'padded',
  },
};

// ========== Comprehensive Demo ==========

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          Primary Variant
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" size="small">
            Small
          </Button>
          <Button variant="primary" size="middle">
            Middle
          </Button>
          <Button variant="primary" size="large">
            Large
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" danger>
            Danger
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          Default Variant
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="default" size="small">
            Small
          </Button>
          <Button variant="default" size="middle">
            Middle
          </Button>
          <Button variant="default" size="large">
            Large
          </Button>
          <Button variant="default" loading>
            Loading
          </Button>
          <Button variant="default" disabled>
            Disabled
          </Button>
          <Button variant="default" danger>
            Danger
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          Dashed Variant
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="dashed" size="small">
            Small
          </Button>
          <Button variant="dashed" size="middle">
            Middle
          </Button>
          <Button variant="dashed" size="large">
            Large
          </Button>
          <Button variant="dashed" loading>
            Loading
          </Button>
          <Button variant="dashed" disabled>
            Disabled
          </Button>
          <Button variant="dashed" danger>
            Danger
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Link Variant</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="link" size="small">
            Small
          </Button>
          <Button variant="link" size="middle">
            Middle
          </Button>
          <Button variant="link" size="large">
            Large
          </Button>
          <Button variant="link" loading>
            Loading
          </Button>
          <Button variant="link" disabled>
            Disabled
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Text Variant</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="text" size="small">
            Small
          </Button>
          <Button variant="text" size="middle">
            Middle
          </Button>
          <Button variant="text" size="large">
            Large
          </Button>
          <Button variant="text" loading>
            Loading
          </Button>
          <Button variant="text" disabled>
            Disabled
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          Shapes & Icons
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button shape="default">Default</Button>
          <Button shape="round">Round</Button>
          <Button shape="circle" icon={<IconPlus />} />
          <Button icon={<IconDownload />}>With Icon</Button>
          <Button icon={<IconSettings />} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ========== Interactive Playground ==========

export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'middle',
    shape: 'default',
    children: 'Click Me',
    loading: false,
    disabled: false,
    danger: false,
    block: false,
  },
};

