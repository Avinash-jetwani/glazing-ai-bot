import type { Meta, StoryObj } from '@storybook/react';
import ChatModal from './ChatModal';

const meta = {
  title: 'Components/ChatModal',
  component: ChatModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    widgetKey: 'test-key-123',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Modal closed'),
    widgetKey: 'test-key-123',
  },
};
