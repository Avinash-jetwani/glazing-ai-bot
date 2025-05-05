import type { Meta, StoryObj } from '@storybook/react';
import Fab from './Fab';

const meta = {
  title: 'Components/Fab',
  component: Fab,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: () => alert('Fab clicked!'),
  },
};
