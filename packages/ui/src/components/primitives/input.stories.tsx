import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Введите имя…' },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const Email: Story = { args: { type: 'email', placeholder: 'you@svetlov.academy' } };
export const Disabled: Story = { args: { disabled: true, placeholder: 'Недоступно' } };

export const WithLabel: Story = {
  render: () => (
    <label className="flex max-w-sm flex-col gap-2 font-heading text-sm font-semibold text-brand-primary">
      Имя слушателя
      <Input placeholder="Иван Иванов" />
    </label>
  ),
};
