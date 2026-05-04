import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { KpiCard } from '@/components/academy/kpi-card';

describe('KpiCard', () => {
  it('рендерит лейбл и значение', () => {
    render(<KpiCard label="Слушатели" value={245} />);
    expect(screen.getByText('Слушатели')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
  });

  it('отображает единицу измерения', () => {
    render(<KpiCard label="Доход" value="1 250 000" unit="₽" />);
    expect(screen.getByText('₽')).toBeInTheDocument();
  });

  it('показывает скелет вместо значения когда loading=true', () => {
    render(<KpiCard label="Бронирования" value={42} loading />);
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-busy', 'true');
  });

  it('рендерит иконку из props', () => {
    const { container } = render(<KpiCard label="Юзеры" value={10} icon={Users} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('показывает дельту с трендом up и доступным sr-текстом', () => {
    render(<KpiCard label="Конверсия" value="12%" trend="up" delta="+3.2%" />);
    expect(screen.getByText('+3.2%')).toBeInTheDocument();
    expect(screen.getByText(/Динамика: рост/)).toBeInTheDocument();
  });

  it('показывает тренд down с правильным sr-текстом', () => {
    render(<KpiCard label="Отказы" value="4%" trend="down" delta="-1%" />);
    expect(screen.getByText(/Динамика: снижение/)).toBeInTheDocument();
  });

  it('отображает hint-подсказку', () => {
    render(<KpiCard label="MRR" value="500K" hint="за последний месяц" />);
    expect(screen.getByText('за последний месяц')).toBeInTheDocument();
  });

  it('применяет акцентный стиль при emphasis=accent', () => {
    render(<KpiCard label="Новый" value={1} emphasis="accent" />);
    expect(screen.getByRole('article')).toHaveClass('border-brand-accent/30');
  });
});
