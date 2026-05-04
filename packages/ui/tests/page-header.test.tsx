import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/academy/page-header';
import { Button } from '@/components/primitives/button';

describe('PageHeader', () => {
  it('рендерит заголовок как h1', () => {
    render(<PageHeader title="Мероприятия" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Мероприятия' })).toBeInTheDocument();
  });

  it('применяет шрифт Playfair Display через font-display класс', () => {
    render(<PageHeader title="Академия" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-display');
  });

  it('показывает eyebrow и описание когда переданы', () => {
    render(
      <PageHeader title="Дашборд" eyebrow="ОБЗОР СЕТИ" description="Метрики по всем филиалам" />,
    );
    expect(screen.getByText('ОБЗОР СЕТИ')).toBeInTheDocument();
    expect(screen.getByText('Метрики по всем филиалам')).toBeInTheDocument();
  });

  it('не рендерит eyebrow и описание если они не переданы', () => {
    const { container } = render(<PageHeader title="Расписание" />);
    expect(container.querySelectorAll('span').length).toBe(0);
    expect(container.querySelector('p')).toBeNull();
  });

  it('рендерит actions-слот', () => {
    render(<PageHeader title="События" actions={<Button>Создать</Button>} />);
    expect(screen.getByRole('button', { name: 'Создать' })).toBeInTheDocument();
  });
});
