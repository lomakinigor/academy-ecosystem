import type { Meta, StoryObj } from '@storybook/react';
import { Users, CalendarCheck, Wallet, Sparkles } from 'lucide-react';
import { KpiCard } from './kpi-card';

const meta: Meta<typeof KpiCard> = {
  title: 'Academy/KpiCard',
  component: KpiCard,
  tags: ['autodocs'],
  argTypes: {
    trend: { control: 'inline-radio', options: ['up', 'down', 'flat', undefined] },
    emphasis: { control: 'inline-radio', options: ['default', 'accent'] },
  },
  args: {
    label: 'Слушатели',
    value: 245,
    icon: Users,
    trend: 'up',
    delta: '+12%',
    hint: 'за месяц',
  },
};
export default meta;

type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {};

export const Accent: Story = { args: { emphasis: 'accent' } };

export const TrendDown: Story = {
  args: {
    label: 'Отказы',
    value: '4.2',
    unit: '%',
    icon: CalendarCheck,
    trend: 'down',
    delta: '-1.1%',
  },
};

export const Loading: Story = { args: { loading: true } };

export const Grid: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Слушатели" value={245} icon={Users} trend="up" delta="+12%" />
      <KpiCard label="Бронирования" value={87} icon={CalendarCheck} trend="up" delta="+5%" />
      <KpiCard label="Доход" value="1.25M" unit="₽" icon={Wallet} trend="flat" delta="0%" emphasis="accent" />
      <KpiCard label="Новые магистры" value={3} icon={Sparkles} trend="up" delta="+2" />
    </div>
  ),
};
