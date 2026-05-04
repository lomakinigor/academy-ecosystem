import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './status-badge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Academy/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['draft', 'planned', 'active', 'completed', 'cancelled'],
    },
    showDot: { control: 'boolean' },
  },
  args: { status: 'planned', showDot: true },
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Draft: Story = { args: { status: 'draft' } };
export const Planned: Story = { args: { status: 'planned' } };
export const Active: Story = { args: { status: 'active' } };
export const Completed: Story = { args: { status: 'completed' } };
export const Cancelled: Story = { args: { status: 'cancelled' } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status="draft" />
      <StatusBadge status="planned" />
      <StatusBadge status="active" />
      <StatusBadge status="completed" />
      <StatusBadge status="cancelled" />
    </div>
  ),
};
