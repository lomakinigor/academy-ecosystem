import type { Meta, StoryObj } from '@storybook/react';
import { AcademicBadge } from './academic-badge';

const meta: Meta<typeof AcademicBadge> = {
  title: 'Academy/AcademicBadge',
  component: AcademicBadge,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['founder', 'magister', 'master', 'listener'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showLabel: { control: 'boolean' },
  },
  args: { level: 'magister', size: 'md', showLabel: true },
};
export default meta;

type Story = StoryObj<typeof AcademicBadge>;

export const Founder: Story = { args: { level: 'founder' } };
export const Magister: Story = { args: { level: 'magister' } };
export const Master: Story = { args: { level: 'master' } };
export const Listener: Story = { args: { level: 'listener' } };

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <AcademicBadge level="founder" />
      <AcademicBadge level="magister" />
      <AcademicBadge level="master" />
      <AcademicBadge level="listener" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <AcademicBadge level="magister" size="sm" />
      <AcademicBadge level="magister" size="md" />
      <AcademicBadge level="magister" size="lg" />
    </div>
  ),
};

export const IconOnly: Story = {
  args: { showLabel: false, size: 'lg' },
};
