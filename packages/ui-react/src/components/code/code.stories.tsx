import type { Meta, StoryObj } from '@storybook/react';
import { Code, type CodeProps } from './code';

const meta: Meta<CodeProps> = {
  title: 'Components/Code',
  component: Code,
  args: {
    children: 'npm create web-loom',
  },
};

export default meta;
type Story = StoryObj<CodeProps>;

export const Inline: Story = {};

export const Block: Story = {
  args: {
    block: true,
    language: 'tsx',
    children: `import { Button } from '@repo/ui-react';

export function CTA() {
  return <Button variant="primary">Ship</Button>;
}`,
  },
};

