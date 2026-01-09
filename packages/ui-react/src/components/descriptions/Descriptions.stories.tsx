import type { Meta, StoryObj } from '@storybook/react';
import { Descriptions } from './Descriptions';

const meta: Meta<typeof Descriptions> = {
  title: 'Components/Descriptions',
  component: Descriptions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Display multiple read-only fields in groups.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the descriptions',
    },
    extra: {
      control: 'text',
      description: 'Extra content in the top-right',
    },
    bordered: {
      control: 'boolean',
      description: 'Whether to show borders',
    },
    column: {
      control: 'object',
      description: 'Number of columns per breakpoint',
    },
    size: {
      control: 'select',
      options: ['default', 'middle', 'small'],
      description: 'Size of descriptions',
    },
    layout: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout direction of label and content',
    },
    colon: {
      control: 'boolean',
      description: 'Show colon after label',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Descriptions>;

export const Default: Story = {
  args: {
    title: 'User Info',
    bordered: false,
    size: 'default',
    layout: 'horizontal',
    colon: true,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
      <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
      <Descriptions.Item label="Address">
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </Descriptions.Item>
    </Descriptions>
  ),
};

export const Bordered: Story = {
  args: {
    title: 'User Info',
    bordered: true,
    size: 'default',
    layout: 'horizontal',
    colon: true,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Product">Cloud Database</Descriptions.Item>
      <Descriptions.Item label="Billing Mode">Prepaid</Descriptions.Item>
      <Descriptions.Item label="Automatic Renewal">YES</Descriptions.Item>
      <Descriptions.Item label="Order time">2018-04-24 18:00:00</Descriptions.Item>
      <Descriptions.Item label="Usage Time" span={2}>
        2019-04-24 18:00:00
      </Descriptions.Item>
      <Descriptions.Item label="Status" span={3}>
        <span style={{ color: '#52c41a' }}>Running</span>
      </Descriptions.Item>
      <Descriptions.Item label="Negotiated Amount">$80.00</Descriptions.Item>
      <Descriptions.Item label="Discount">$20.00</Descriptions.Item>
      <Descriptions.Item label="Official Receipts">$60.00</Descriptions.Item>
      <Descriptions.Item label="Config Info">
        Data disk type: MongoDB
        <br />
        Database version: 3.4
        <br />
        Package: dds.mongo.mid
        <br />
        Storage space: 10 GB
        <br />
        Replication factor: 3
        <br />
        Region: East China 1
      </Descriptions.Item>
    </Descriptions>
  ),
};

export const WithExtra: Story = {
  args: {
    title: 'User Info',
    extra: (
      <button
        style={{
          padding: '4px 12px',
          cursor: 'pointer',
          border: '1px solid var(--color-border, #d9d9d9)',
          borderRadius: '4px',
          backgroundColor: 'var(--color-bg-container, #ffffff)',
          color: 'var(--color-text-primary, #262626)',
        }}
      >
        Edit
      </button>
    ),
    bordered: false,
    size: 'default',
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
      <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
      <Descriptions.Item label="Address" span={2}>
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </Descriptions.Item>
      <Descriptions.Item label="Remark">empty</Descriptions.Item>
    </Descriptions>
  ),
};

export const VerticalLayout: Story = {
  args: {
    title: 'User Info',
    layout: 'vertical',
    bordered: true,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
      <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
      <Descriptions.Item label="Address">
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </Descriptions.Item>
      <Descriptions.Item label="Remark">empty</Descriptions.Item>
    </Descriptions>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #262626)',
          }}
        >
          Small
        </h3>
        <Descriptions title="Small Size" size="small" bordered>
          <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
          <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
          <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
        </Descriptions>
      </div>

      <div>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #262626)',
          }}
        >
          Default
        </h3>
        <Descriptions title="Default Size" size="default" bordered>
          <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
          <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
          <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
        </Descriptions>
      </div>

      <div>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #262626)',
          }}
        >
          Middle
        </h3>
        <Descriptions title="Middle Size" size="middle" bordered>
          <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
          <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
          <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  ),
};

export const ResponsiveColumns: Story = {
  args: {
    title: 'Responsive Columns',
    bordered: true,
    column: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 },
  },
  render: (args) => (
    <div>
      <p
        style={{
          marginBottom: '16px',
          color: 'var(--color-text-secondary, #666)',
          fontSize: '14px',
          fontStyle: 'italic',
        }}
      >
        Resize the window to see responsive behavior (xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4)
      </p>
      <Descriptions {...args}>
        <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
        <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
        <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
        <Descriptions.Item label="Email">user@example.com</Descriptions.Item>
        <Descriptions.Item label="Address" span={2}>
          No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
        </Descriptions.Item>
        <Descriptions.Item label="Company">Example Corp</Descriptions.Item>
        <Descriptions.Item label="Department">Engineering</Descriptions.Item>
        <Descriptions.Item label="Position">Senior Developer</Descriptions.Item>
        <Descriptions.Item label="Experience">5 years</Descriptions.Item>
      </Descriptions>
    </div>
  ),
};

export const WithSpanning: Story = {
  args: {
    title: 'Custom Spanning',
    bordered: true,
    column: 4,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
      <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
      <Descriptions.Item label="Email">user@example.com</Descriptions.Item>

      <Descriptions.Item label="Address" span={3}>
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </Descriptions.Item>
      <Descriptions.Item label="Zip Code">310000</Descriptions.Item>

      <Descriptions.Item label="Full Description" span={4}>
        This is a very long description that spans across all four columns to demonstrate the spanning functionality. It
        can contain any content and will automatically wrap to the next line when needed.
      </Descriptions.Item>

      <Descriptions.Item label="Status" span={2}>
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Active</span>
      </Descriptions.Item>
      <Descriptions.Item label="Priority" span={2}>
        <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>High</span>
      </Descriptions.Item>
    </Descriptions>
  ),
};

export const WithoutColon: Story = {
  args: {
    title: 'Without Colon',
    colon: false,
    bordered: false,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Phone">1810000000</Descriptions.Item>
      <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
      <Descriptions.Item label="Address">
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </Descriptions.Item>
    </Descriptions>
  ),
};

export const ComplexContent: Story = {
  args: {
    title: 'Complex Content Example',
    bordered: true,
    column: 3,
  },
  render: (args) => (
    <Descriptions {...args}>
      <Descriptions.Item label="Name">Zhou Maomao</Descriptions.Item>
      <Descriptions.Item label="Status">
        <span
          style={{
            backgroundColor: '#f6ffed',
            color: '#52c41a',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #b7eb8f',
          }}
        >
          Active
        </span>
      </Descriptions.Item>
      <Descriptions.Item label="Rating">
        <div style={{ display: 'flex', gap: '2px' }}>
          {'★★★★☆'.split('').map((star, i) => (
            <span key={i} style={{ color: star === '★' ? '#faad14' : '#d9d9d9' }}>
              {star}
            </span>
          ))}
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Tags" span={2}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['React', 'TypeScript', 'CSS', 'Storybook'].map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: 'var(--color-bg-layout, #f0f0f0)',
                color: 'var(--color-text-secondary, #666)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid var(--color-border, #d9d9d9)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Progress">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '100px',
              height: '8px',
              backgroundColor: 'var(--color-bg-layout, #f0f0f0)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--color-border, #d9d9d9)',
            }}
          >
            <div
              style={{
                width: '75%',
                height: '100%',
                backgroundColor: 'var(--color-primary, #1677ff)',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #666)' }}>75%</span>
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Actions" span={3}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              border: '1px solid var(--color-border, #d9d9d9)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-container, #ffffff)',
              color: 'var(--color-text-primary, #262626)',
            }}
          >
            Edit
          </button>
          <button
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              border: '1px solid var(--color-border, #d9d9d9)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-container, #ffffff)',
              color: 'var(--color-text-primary, #262626)',
            }}
          >
            Delete
          </button>
          <button
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              border: '1px solid var(--color-border, #d9d9d9)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-container, #ffffff)',
              color: 'var(--color-text-primary, #262626)',
            }}
          >
            Archive
          </button>
        </div>
      </Descriptions.Item>
    </Descriptions>
  ),
};
