import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, type AvatarProps, AvatarGroup } from './Avatar';

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 1.5c-2.33 0-4.4 1.17-5.73 2.98a.75.75 0 00.63 1.12h10.2a.75.75 0 00.63-1.12A6.132 6.132 0 008 9.5z"
      fill="currentColor"
    />
  </svg>
);

const ExampleImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23566eea"/%3E%3Ctext x="50%25" y="54%25" text-anchor="middle" fill="%23fff" font-size="20" font-family="Arial, Helvetica, sans-serif" dy=".3em"%3EJD%3C/text%3E%3C/svg%3E';

const meta: Meta<AvatarProps> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<AvatarProps>;

export const Default: Story = {
  args: {
    children: 'Jane Doe',
  },
};

export const ImageAvatar: Story = {
  args: {
    src: ExampleImage,
    alt: 'Initials placeholder image',
  },
};

export const IconAvatar: Story = {
  args: {
    icon: <UserIcon />,
    alt: 'User icon',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar size="small">Alex</Avatar>
      <Avatar size="default">Alex</Avatar>
      <Avatar size="large">Alex</Avatar>
      <Avatar size={64}>Alex</Avatar>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar shape="circle">Circle</Avatar>
      <Avatar shape="square">Square</Avatar>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup maxCount={3} description="Project team">
      <Avatar src={ExampleImage} alt="Alex" />
      <Avatar icon={<UserIcon />} alt="Bailey" />
      <Avatar>Casey</Avatar>
      <Avatar>Dev</Avatar>
    </AvatarGroup>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <Avatar src="/broken-path" alt="Unavailable">
      Unavailable
    </Avatar>
  ),
};
