import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { PageHeader } from './page-header';
import { Button } from '../primitives/button';

const meta: Meta<typeof PageHeader> = {
  title: 'Academy/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Мероприятия академии',
    description: 'Все семинары, практики и мастер-классы вашего филиала',
    eyebrow: 'РАСПИСАНИЕ',
  },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="outline">Экспорт</Button>
        <Button variant="accent">
          <Plus />
          Создать
        </Button>
      </>
    ),
  },
};

export const Minimal: Story = {
  args: { title: 'Мой профиль', description: undefined, eyebrow: undefined },
};

export const Centered: Story = {
  args: { align: 'center', actions: undefined },
};
