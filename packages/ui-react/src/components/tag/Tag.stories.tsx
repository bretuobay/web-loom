/**
 * Tag Component Stories
 *
 * Demonstrates all variants and use cases of the Tag component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';
import { useState } from 'react';

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A compact element for displaying labels, categories, and status information.

## Features
- **Color Variants**: Preset colors (success, error, warning, processing) and custom colors
- **Closable**: Optional close functionality with custom close icons
- **Icons**: Support for leading icons
- **Checkable**: Interactive selection state with Tag.CheckableTag
- **Accessibility**: Full keyboard navigation and ARIA support
- **Theming**: Fully themable with CSS custom properties

## Usage

\`\`\`tsx
import { Tag } from '@repo/ui-react';

// Basic tag
<Tag>Basic Tag</Tag>

// Colored tag
<Tag color="success">Success</Tag>

// Closable tag
<Tag closable onClose={(e) => console.log('Closed')}>
  Closable Tag
</Tag>

// Checkable tag
<Tag.CheckableTag checked={checked} onChange={setChecked}>
  Checkable Tag
</Tag.CheckableTag>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    color: {
      control: { type: 'select' },
      options: ['default', 'success', 'processing', 'error', 'warning'],
      description: 'Tag color variant or custom color string',
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Whether the tag can be closed',
    },
    bordered: {
      control: { type: 'boolean' },
      description: 'Whether to show border',
    },
    children: {
      control: { type: 'text' },
      description: 'Tag content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

/**
 * Default tag with basic styling
 */
export const Default: Story = {
  args: {
    children: 'Default Tag',
  },
};

/**
 * All preset color variants
 */
export const ColorVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag color="default">Default</Tag>
      <Tag color="success">Success</Tag>
      <Tag color="processing">Processing</Tag>
      <Tag color="error">Error</Tag>
      <Tag color="warning">Warning</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset color variants for different states and contexts.',
      },
    },
  },
};

/**
 * Custom colors using hex, rgb, or named colors
 */
export const CustomColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag color="#f50">Red</Tag>
      <Tag color="#2db7f5">Blue</Tag>
      <Tag color="#87d068">Green</Tag>
      <Tag color="#108ee9">Ocean</Tag>
      <Tag color="purple">Purple</Tag>
      <Tag color="orange">Orange</Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags with custom colors. Accepts any valid CSS color value.',
      },
    },
  },
};

/**
 * Tags that can be closed by the user
 */
export const ClosableTags: Story = {
  render: () => {
    const [tags, setTags] = useState([
      { id: 1, label: 'Tag 1', color: 'default' },
      { id: 2, label: 'Tag 2', color: 'success' },
      { id: 3, label: 'Long Tag Name', color: 'processing' },
      { id: 4, label: 'Tag 4', color: 'error' },
    ]);

    const handleClose = (id: number) => {
      setTags((prev) => prev.filter((tag) => tag.id !== id));
    };

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Tag key={tag.id} color={tag.color as any} closable onClose={() => handleClose(tag.id)}>
            {tag.label}
          </Tag>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Tags with close functionality. Click the × to remove a tag.',
      },
    },
  },
};

/**
 * Tags with leading icons
 */
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag color="success" icon={<span>✓</span>}>
        Success
      </Tag>
      <Tag color="error" icon={<span>✗</span>}>
        Error
      </Tag>
      <Tag color="warning" icon={<span>⚠</span>}>
        Warning
      </Tag>
      <Tag color="processing" icon={<span>↻</span>}>
        Processing
      </Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags with leading icons for better visual context.',
      },
    },
  },
};

/**
 * Tags without borders
 */
export const Borderless: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag bordered={false}>Default</Tag>
      <Tag color="success" bordered={false}>
        Success
      </Tag>
      <Tag color="processing" bordered={false}>
        Processing
      </Tag>
      <Tag color="error" bordered={false}>
        Error
      </Tag>
      <Tag color="warning" bordered={false}>
        Warning
      </Tag>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tags without borders for a cleaner appearance.',
      },
    },
  },
};

/**
 * Interactive selectable tags
 */
export const CheckableTags: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<string[]>(['JavaScript']);

    const tags = ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'Go'];

    const handleChange = (tag: string, checked: boolean) => {
      if (checked) {
        setSelectedTags((prev) => [...prev, tag]);
      } else {
        setSelectedTags((prev) => prev.filter((t) => t !== tag));
      }
    };

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Tag.CheckableTag
            key={tag}
            checked={selectedTags.includes(tag)}
            onChange={(checked) => handleChange(tag, checked)}
          >
            {tag}
          </Tag.CheckableTag>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive tags that can be selected/deselected. Useful for filters or categories.',
      },
    },
  },
};

/**
 * Complex example with multiple features
 */
export const ComplexExample: Story = {
  render: () => {
    const [categories, setCategories] = useState([
      { id: 1, name: 'Frontend', color: '#1890ff', selected: true },
      { id: 2, name: 'Backend', color: '#52c41a', selected: false },
      { id: 3, name: 'Database', color: '#faad14', selected: true },
    ]);

    const [dynamicTags, setDynamicTags] = useState([
      { id: 1, label: 'React', color: 'processing' },
      { id: 2, label: 'Urgent', color: 'error' },
      { id: 3, label: 'Review', color: 'warning' },
    ]);

    const handleCategoryToggle = (id: number) => {
      setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, selected: !cat.selected } : cat)));
    };

    const handleTagClose = (id: number) => {
      setDynamicTags((prev) => prev.filter((tag) => tag.id !== id));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Categories (Checkable):</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Tag.CheckableTag
                key={category.id}
                checked={category.selected}
                onChange={() => handleCategoryToggle(category.id)}
                style={{ color: category.color, borderColor: category.color }}
              >
                {category.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Labels (Closable):</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {dynamicTags.map((tag) => (
              <Tag
                key={tag.id}
                color={tag.color as any}
                closable
                onClose={() => handleTagClose(tag.id)}
                icon={tag.color === 'error' ? <span>🔥</span> : undefined}
              >
                {tag.label}
              </Tag>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Status Indicators:</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag color="success" icon={<span>✓</span>}>
              Completed
            </Tag>
            <Tag color="processing" icon={<span>↻</span>}>
              In Progress
            </Tag>
            <Tag color="warning" icon={<span>⏸</span>}>
              On Hold
            </Tag>
            <Tag color="error" icon={<span>✗</span>}>
              Failed
            </Tag>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A complex example combining different tag features in a realistic interface.',
      },
    },
  },
};

/**
 * Playground for testing different props
 */
export const Playground: Story = {
  args: {
    children: 'Playground Tag',
    color: 'default',
    closable: false,
    bordered: true,
  },
};
