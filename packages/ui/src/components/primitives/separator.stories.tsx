import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <p className="font-heading text-sm font-semibold">Профиль</p>
      <Separator className="my-3" />
      <p className="text-sm text-foreground/70">Личные данные</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4 text-sm">
      <span>Москва</span>
      <Separator orientation="vertical" />
      <span>Челябинск</span>
    </div>
  ),
};
