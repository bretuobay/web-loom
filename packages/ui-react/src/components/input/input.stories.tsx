import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Input, InputGroup, InputPassword, InputSearch, InputTextArea } from './Input';

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="4" width="12" height="10" stroke="currentColor" strokeWidth="1.5" rx="2" />
    <path d="M2 7h12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Visual size variant',
    },
    allowClear: {
      control: 'boolean',
      description: 'Show the clear button when the input is populated',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    addonBefore: {
      description: 'Content rendered before the control',
    },
    addonAfter: {
      description: 'Content rendered after the control',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Type something…',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input size="small" placeholder="Size small" />
      <Input size="middle" placeholder="Size middle" />
      <Input size="large" placeholder="Size large" />
    </div>
  ),
};

export const PrefixSuffix: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input prefix={<IconSearch />} placeholder="With prefix" />
      <Input suffix={<IconCalendar />} placeholder="With suffix" />
    </div>
  ),
};

export const Addons: Story = {
  render: () => (
    <Input
      placeholder="Recipient"
      addonBefore="http://"
      addonAfter=".com"
    />
  ),
};

export const Clearable: Story = {
  render: () => <Input placeholder="Clear me" allowClear defaultValue="Ready to clear" />,
};

export const DisabledStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input placeholder="Disabled" disabled />
      <InputPassword placeholder="Disabled password" disabled />
      <InputSearch placeholder="Disabled search" disabled />
      <InputTextArea placeholder="Disabled textarea" disabled />
    </div>
  ),
};

export const PasswordField: Story = {
  render: () => <InputPassword placeholder="Enter your password" allowClear />,
};

export const SearchField: Story = {
  render: () => (
    <InputSearch
      placeholder="Search pattern"
      onSearch={action('search')}
    />
  ),
};

export const TextArea: Story = {
  render: () => (
    <InputTextArea
      size="large"
      placeholder="Leave your thoughts"
      rows={4}
    />
  ),
};

export const Grouped: Story = {
  render: () => (
    <InputGroup>
      <Input placeholder="First name" />
      <Input placeholder="Last name" />
    </InputGroup>
  ),
};
