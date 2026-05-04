import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="upcoming" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="upcoming">Будущие</TabsTrigger>
        <TabsTrigger value="active">Идут</TabsTrigger>
        <TabsTrigger value="archive">Архив</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">Запланированные мероприятия филиала.</TabsContent>
      <TabsContent value="active">Идущие прямо сейчас занятия.</TabsContent>
      <TabsContent value="archive">Завершённые мероприятия.</TabsContent>
    </Tabs>
  ),
};
