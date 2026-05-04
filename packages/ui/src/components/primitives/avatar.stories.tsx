import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback>ВС</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarImage src="https://i.pravatar.cc/120?img=12" alt="Виктор" />
        <AvatarFallback>В</AvatarFallback>
      </Avatar>
    </div>
  ),
};
