import type { Meta, StoryObj } from '@storybook/react';
import ChatModal from './ChatModal';
import { useState } from 'react';

const meta = {
  title: 'Components/ChatModal',
  component: ChatModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    widgetKey: 'demo-widget-key',
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    widgetKey: 'demo-widget-key',
  },
};

export const WithControls = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Open Chat
      </button>
      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        widgetKey="demo-widget-key"
      />
    </div>
  );
};
