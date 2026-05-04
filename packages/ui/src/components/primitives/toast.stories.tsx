import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { Button } from './button';

const meta: Meta<typeof Toast> = {
  title: 'Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    function ToastDemo() {
      const [open, setOpen] = useState(false);
      return (
        <ToastProvider swipeDirection="right">
          <Button variant="accent" onClick={() => setOpen(true)}>
            Показать тост
          </Button>
          <Toast open={open} onOpenChange={setOpen} variant="success">
            <div>
              <ToastTitle>Запись подтверждена</ToastTitle>
              <ToastDescription>Вы записаны на семинар 15 мая в 19:00</ToastDescription>
            </div>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    }
    return <ToastDemo />;
  },
};
