import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="w-72">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Выберите филиал" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Россия</SelectLabel>
            <SelectItem value="moscow">Москва</SelectItem>
            <SelectItem value="chelyabinsk">Челябинск</SelectItem>
            <SelectItem value="spb">Санкт-Петербург</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};
