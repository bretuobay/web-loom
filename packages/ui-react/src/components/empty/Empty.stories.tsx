import type { Meta, StoryObj } from '@storybook/react';
import { Empty } from './Empty';
import { Button } from '../button/Button';

const meta: Meta<typeof Empty> = {
  title: 'Feedback/Empty',
  component: Empty,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Empty state component for displaying when there is no data to show.',
      },
    },
  },
  argTypes: {
    description: {
      control: 'text',
      description: 'Custom description text',
    },
    image: {
      control: false,
      description: 'Custom image or icon',
    },
    imageStyle: {
      control: 'object',
      description: 'Custom styles for the image wrapper',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Size of the empty state',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class name',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Empty>;

// Basic Examples
export const Default: Story = {
  args: {},
};

export const CustomDescription: Story = {
  args: {
    description: 'No items found',
  },
};

export const WithCustomElement: Story = {
  args: {
    description: (
      <span>
        Nothing found here!
        <br />
        <small style={{ opacity: 0.6 }}>Try adjusting your filters</small>
      </span>
    ),
  },
};

// Size Variations
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, alignItems: 'center' }}>
      <div style={{ border: '1px dashed #d9d9d9', padding: 16, borderRadius: 8 }}>
        <Empty size="small" description="Small" />
      </div>
      <div style={{ border: '1px dashed #d9d9d9', padding: 16, borderRadius: 8 }}>
        <Empty size="default" description="Default" />
      </div>
      <div style={{ border: '1px dashed #d9d9d9', padding: 16, borderRadius: 8 }}>
        <Empty size="large" description="Large" />
      </div>
    </div>
  ),
};

export const Small: Story = {
  args: {
    size: 'small',
    description: 'No data',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    description: 'No content available',
  },
};

// With Actions
export const WithSingleAction: Story = {
  args: {
    description: 'No results found',
    children: <Button variant="primary">Create New Item</Button>,
  },
};

export const WithMultipleActions: Story = {
  args: {
    description: 'No data available',
    children: (
      <>
        <Button variant="primary">Create Item</Button>
        <Button>Learn More</Button>
      </>
    ),
  },
};

// Custom Image
export const CustomImage: Story = {
  args: {
    image: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" fill="#e6f4ff" />
        <path
          d="M32 20v24M20 32h24"
          stroke="#1677ff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    ),
    description: 'Click the button to add your first item',
    children: <Button variant="primary">Add Item</Button>,
  },
};

export const WithIcon: Story = {
  args: {
    image: <span style={{ fontSize: 48 }}>📭</span>,
    description: 'Your inbox is empty',
  },
};

// Real-world Examples
export const SearchResults: Story = {
  name: 'Search - No Results',
  render: () => (
    <div style={{ width: 400, padding: 24, border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Empty
        description={
          <span>
            No results found for "<strong>your search</strong>"
            <br />
            <small style={{ opacity: 0.6 }}>Try different keywords</small>
          </span>
        }
      >
        <Button>Clear Filters</Button>
      </Empty>
    </div>
  ),
};

export const EmptyList: Story = {
  name: 'List - No Items',
  render: () => (
    <div style={{ width: 500, padding: 24, border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Empty
        description="You don't have any items yet"
        children={
          <>
            <Button variant="primary">Create New</Button>
            <Button>Import Items</Button>
          </>
        }
      />
    </div>
  ),
};

export const EmptyInbox: Story = {
  name: 'Inbox - No Messages',
  render: () => (
    <div style={{ width: 600, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Empty
        size="large"
        image={<span style={{ fontSize: 64 }}>📬</span>}
        description={
          <span>
            All caught up!
            <br />
            <small style={{ opacity: 0.6 }}>No new messages</small>
          </span>
        }
      />
    </div>
  ),
};

export const Error404: Story = {
  name: '404 - Page Not Found',
  render: () => (
    <div style={{ width: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Empty
        size="large"
        image={
          <div style={{ fontSize: 72, fontWeight: 700, color: '#d9d9d9' }}>
            404
          </div>
        }
        description={
          <span>
            <strong style={{ fontSize: 18 }}>Page Not Found</strong>
            <br />
            <small style={{ opacity: 0.6 }}>The page you are looking for doesn't exist</small>
          </span>
        }
      >
        <Button variant="primary" size="large">Go Home</Button>
      </Empty>
    </div>
  ),
};

// Dark Mode Preview
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 24, background: '#141414', minHeight: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    description: 'No data in dark mode',
    children: <Button variant="primary">Create New</Button>,
  },
};

// With Custom Styling
export const CustomStyling: Story = {
  args: {
    description: 'Custom styled empty state',
    className: 'custom-empty',
    style: {
      border: '2px dashed #1677ff',
      borderRadius: 12,
      padding: 48,
      background: '#f0f7ff',
    },
    children: <Button variant="primary">Get Started</Button>,
  },
};

// Playground
export const Playground: Story = {
  args: {
    description: 'Customize this empty state',
    size: 'default',
  },
  argTypes: {
    children: {
      control: false,
    },
  },
};
