import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'outline', 'ghost', 'link', 'destructive', 'secondary'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Записаться', variant: 'default', size: 'md' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};
export const Accent: Story = { args: { variant: 'accent', children: 'Стать слушателем' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Отменить' } };

export const WithIcon: Story = {
  args: {
    variant: 'accent',
    children: (
      <>
        <Plus />
        Новое мероприятие
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: { size: 'icon', 'aria-label': 'Добавить', children: <Sparkles /> },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
