import type { Meta, StoryObj } from '@storybook/react';
import { UserCard } from './user-card';
import { Button } from '../primitives/button';

const meta: Meta<typeof UserCard> = {
  title: 'Academy/UserCard',
  component: UserCard,
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'select', options: ['founder', 'magister', 'master', 'listener'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    isSpeaker: { control: 'boolean' },
  },
  args: {
    name: 'Виктор Светлов',
    level: 'founder',
    subtitle: 'Основатель академии',
    branchLabel: 'Москва',
    size: 'md',
  },
};
export default meta;

type Story = StoryObj<typeof UserCard>;

export const Founder: Story = {};

export const Magister: Story = {
  args: {
    name: 'Анна Петрова',
    level: 'magister',
    subtitle: 'Ведущий магистр',
    branchLabel: 'Челябинск',
    isSpeaker: true,
  },
};

export const Listener: Story = {
  args: {
    name: 'Иван Иванов',
    level: 'listener',
    subtitle: 'Программа: основы',
    branchLabel: 'Москва',
  },
};

export const WithAction: Story = {
  args: {
    name: 'Дмитрий Соколов',
    level: 'master',
    subtitle: 'Куратор практик',
    branchLabel: 'Москва',
    action: <Button size="sm" variant="outline">Профиль</Button>,
  },
};

export const NoAvatar: Story = {
  args: { avatarUrl: undefined },
};
