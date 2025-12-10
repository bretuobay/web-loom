import type { Meta, StoryObj } from '@storybook/react';
import { Divider, type DividerProps } from './Divider';

const meta: Meta<DividerProps> = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Type of divider',
    },
    orientation: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text orientation (only for horizontal with text)',
    },
    dashed: {
      control: 'boolean',
      description: 'Whether to use dashed line',
    },
    plain: {
      control: 'boolean',
      description: 'Whether to use plain text style',
    },
  },
};

export default meta;
type Story = StoryObj<DividerProps>;

/**
 * Default horizontal divider
 */
export const Default: Story = {
  render: () => (
    <div>
      <p>Above the divider</p>
      <Divider />
      <p>Below the divider</p>
    </div>
  ),
};

/**
 * Horizontal divider with text
 */
export const WithText: Story = {
  render: () => (
    <div>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      <Divider>Section Break</Divider>
      <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    </div>
  ),
};

/**
 * Horizontal divider with text aligned left
 */
export const TextLeft: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider orientation="left">Left Aligned</Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Horizontal divider with text aligned center (default)
 */
export const TextCenter: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider orientation="center">Center Aligned</Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Horizontal divider with text aligned right
 */
export const TextRight: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider orientation="right">Right Aligned</Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Dashed horizontal divider
 */
export const Dashed: Story = {
  render: () => (
    <div>
      <p>Content above dashed divider</p>
      <Divider dashed />
      <p>Content below dashed divider</p>
    </div>
  ),
};

/**
 * Dashed divider with text
 */
export const DashedWithText: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider dashed>Dashed Divider</Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Plain text style (less emphasis)
 */
export const PlainText: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider plain>Plain Style Text</Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Vertical divider for inline content
 */
export const Vertical: Story = {
  render: () => (
    <div>
      <span>Left Content</span>
      <Divider type="vertical" />
      <span>Middle Content</span>
      <Divider type="vertical" />
      <span>Right Content</span>
    </div>
  ),
};

/**
 * Dashed vertical divider
 */
export const VerticalDashed: Story = {
  render: () => (
    <div>
      <span>Item 1</span>
      <Divider type="vertical" dashed />
      <span>Item 2</span>
      <Divider type="vertical" dashed />
      <span>Item 3</span>
    </div>
  ),
};

/**
 * Divider with custom ReactNode content
 */
export const CustomContent: Story = {
  render: () => (
    <div>
      <p>Content above</p>
      <Divider>
        <span style={{ background: '#1e40af', color: 'white', padding: '4px 12px', borderRadius: '12px' }}>
          ⭐ Featured Section
        </span>
      </Divider>
      <p>Content below</p>
    </div>
  ),
};

/**
 * Multiple dividers with different orientations
 */
export const MultipleOrientations: Story = {
  render: () => (
    <div>
      <h2>Article Title</h2>
      <Divider orientation="left">Introduction</Divider>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </p>
      <Divider orientation="center">Main Content</Divider>
      <p>
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <Divider orientation="right">Conclusion</Divider>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
    </div>
  ),
};

/**
 * Combination of plain and dashed styles
 */
export const PlainAndDashed: Story = {
  render: () => (
    <div>
      <p>Section 1</p>
      <Divider plain dashed>
        Optional Section
      </Divider>
      <p>Section 2</p>
    </div>
  ),
};

/**
 * Navigation menu with vertical dividers
 */
export const NavigationMenu: Story = {
  render: () => (
    <nav style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
      <a href="#home" style={{ textDecoration: 'none', color: '#1e40af', fontWeight: 'bold' }}>
        Home
      </a>
      <Divider type="vertical" />
      <a href="#about" style={{ textDecoration: 'none', color: '#1e40af' }}>
        About
      </a>
      <Divider type="vertical" />
      <a href="#services" style={{ textDecoration: 'none', color: '#1e40af' }}>
        Services
      </a>
      <Divider type="vertical" />
      <a href="#contact" style={{ textDecoration: 'none', color: '#1e40af' }}>
        Contact
      </a>
    </nav>
  ),
};

/**
 * Document sections with labeled dividers
 */
export const DocumentSections: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <h1>Document Title</h1>
      <Divider orientation="left">
        <strong>📋 Summary</strong>
      </Divider>
      <p>This is the summary section of the document. It provides an overview of the main topics covered below.</p>
      <Divider orientation="left">
        <strong>📖 Details</strong>
      </Divider>
      <p>
        This section contains detailed information about the topic. It includes comprehensive explanations and examples.
      </p>
      <Divider orientation="left">
        <strong>✅ Conclusion</strong>
      </Divider>
      <p>Final thoughts and summary of key points discussed in this document.</p>
    </div>
  ),
};

/**
 * All orientations comparison
 */
export const AllOrientations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3>Left Orientation</h3>
        <Divider orientation="left">Left</Divider>
      </div>
      <div>
        <h3>Center Orientation (Default)</h3>
        <Divider orientation="center">Center</Divider>
      </div>
      <div>
        <h3>Right Orientation</h3>
        <Divider orientation="right">Right</Divider>
      </div>
    </div>
  ),
};

/**
 * Breadcrumb-style navigation
 */
export const Breadcrumb: Story = {
  render: () => (
    <div style={{ fontSize: '14px', color: '#64748b' }}>
      <a href="#home" style={{ textDecoration: 'none', color: '#1e40af' }}>
        Home
      </a>
      <Divider type="vertical" />
      <a href="#products" style={{ textDecoration: 'none', color: '#1e40af' }}>
        Products
      </a>
      <Divider type="vertical" />
      <a href="#electronics" style={{ textDecoration: 'none', color: '#1e40af' }}>
        Electronics
      </a>
      <Divider type="vertical" />
      <span style={{ color: '#111827', fontWeight: 'bold' }}>Laptop</span>
    </div>
  ),
};
