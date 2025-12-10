/**
 * Space Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Space, type SpaceProps } from './Space';
import { Button } from '../button/Button';

const meta: Meta<SpaceProps> = {
  title: 'Components/Space',
  component: Space,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large', 32],
    },
    align: {
      control: 'select',
      options: ['start', 'end', 'center', 'baseline', 'stretch'],
    },
    wrap: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<SpaceProps>;

// Basic horizontal spacing
export const Horizontal: Story = {
  render: () => (
    <Space>
      <Button>Button 1</Button>
      <Button>Button 2</Button>
      <Button>Button 3</Button>
    </Space>
  ),
};

// Vertical spacing
export const Vertical: Story = {
  render: () => (
    <Space direction="vertical">
      <Button block>Button 1</Button>
      <Button block>Button 2</Button>
      <Button block>Button 3</Button>
    </Space>
  ),
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Small (8px)</h4>
        <Space size="small">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </Space>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Middle (16px)</h4>
        <Space size="middle">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </Space>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Large (24px)</h4>
        <Space size="large">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </Space>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Custom (32px)</h4>
        <Space size={32}>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </Space>
      </div>
    </div>
  ),
};

// Alignment options
export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Start</h4>
        <Space align="start">
          <Button size="small">Small</Button>
          <Button size="middle">Middle</Button>
          <Button size="large">Large</Button>
        </Space>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Center</h4>
        <Space align="center">
          <Button size="small">Small</Button>
          <Button size="middle">Middle</Button>
          <Button size="large">Large</Button>
        </Space>
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>End</h4>
        <Space align="end">
          <Button size="small">Small</Button>
          <Button size="middle">Middle</Button>
          <Button size="large">Large</Button>
        </Space>
      </div>
    </div>
  ),
};

// Wrap example
export const Wrap: Story = {
  render: () => (
    <div style={{ width: '300px', border: '1px dashed #ccc', padding: '16px' }}>
      <Space wrap>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
        <Button>Button 4</Button>
        <Button>Button 5</Button>
        <Button>Button 6</Button>
      </Space>
    </div>
  ),
};

// Nested spaces
export const Nested: Story = {
  render: () => (
    <Space direction="vertical" size="large">
      <Space>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
      </Space>
      <Space>
        <Button variant="default">Edit</Button>
        <Button variant="default">Delete</Button>
      </Space>
    </Space>
  ),
};

// Playground
export const Playground: Story = {
  args: {
    direction: 'horizontal',
    size: 'middle',
    align: 'start',
    wrap: false,
  },
  render: (args) => (
    <Space {...args}>
      <Button>Button 1</Button>
      <Button>Button 2</Button>
      <Button>Button 3</Button>
    </Space>
  ),
};
