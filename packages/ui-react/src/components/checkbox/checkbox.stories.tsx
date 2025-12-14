import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    children: 'Accept terms',
    value: 'terms',
  },
};

export const Indeterminate: Story = {
  render: () => (
    <Checkbox indeterminate value="indeterminate">
      Partially selected
    </Checkbox>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Checkbox disabled value="one">
        Disabled unchecked
      </Checkbox>
      <Checkbox disabled checked value="two">
        Disabled checked
      </Checkbox>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <Checkbox.Group
      label="Notifications"
      required
      defaultValue={['email']}
      onChange={action('group-change')}
      ariaLabel="Notification preferences"
    >
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">SMS</Checkbox>
      <Checkbox value="push">Push</Checkbox>
    </Checkbox.Group>
  ),
};
