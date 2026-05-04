import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Семинар по ораторскому мастерству</CardTitle>
        <CardDescription>Москва · 15 мая, 19:00</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/75">
          Двухчасовая практика с разбором техник публичного выступления.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="accent">Записаться</Button>
      </CardFooter>
    </Card>
  ),
};
