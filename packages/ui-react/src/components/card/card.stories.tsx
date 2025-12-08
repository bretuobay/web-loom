import type { Meta, StoryObj } from '@storybook/react';
import { Card, type CardProps } from './card';

const meta: Meta<CardProps> = {
  title: 'Components/Card',
  component: Card,
  args: {
    title: 'Design tokens',
    description: 'Explore border, color and typography primitives.',
  },
};

export default meta;
type Story = StoryObj<CardProps>;

export const Default: Story = {};

export const WithBadgeAndFooter: Story = {
  args: {
    badge: 'Beta',
    footer: (
      <>
        Explore primitives <span aria-hidden="true">→</span>
      </>
    ),
  },
};

export const AsLink: Story = {
  args: {
    href: 'https://example.com/design',
    footer: 'Opens in a new tab',
  },
};

