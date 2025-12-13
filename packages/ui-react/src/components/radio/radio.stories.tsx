import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Radio value="option-a">Option A</Radio>
      <Radio value="option-b">Option B</Radio>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <Radio.Group label="Payment" required onChange={action('group-change')} defaultValue="credit">
      <Radio value="credit">Credit</Radio>
      <Radio value="debit">Debit</Radio>
    </Radio.Group>
  ),
};

export const ButtonStyle: Story = {
  render: () => (
    <Radio.Group onChange={action('button-group-change')} defaultValue="monthly">
      <Radio.Button value="monthly">Monthly</Radio.Button>
      <Radio.Button value="yearly">Yearly</Radio.Button>
    </Radio.Group>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Radio disabled value="alpha">
        Alpha
      </Radio>
      <Radio disabled checked value="beta">
        Beta
      </Radio>
    </div>
  ),
};
