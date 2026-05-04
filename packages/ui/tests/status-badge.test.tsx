import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/academy/status-badge';

describe('StatusBadge', () => {
  it('рендерит русский лейбл для каждого статуса', () => {
    const cases = [
      ['draft', 'Черновик'],
      ['planned', 'Запланировано'],
      ['active', 'Идёт сейчас'],
      ['completed', 'Завершено'],
      ['cancelled', 'Отменено'],
    ] as const;

    for (const [status, label] of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('добавляет data-status атрибут для CSS-таргетинга', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByLabelText(/Статус: Идёт сейчас/i);
    expect(badge).toHaveAttribute('data-status', 'active');
  });

  it('по умолчанию отображает индикатор-точку', () => {
    const { container } = render(<StatusBadge status="planned" />);
    expect(container.querySelector('span > span[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('скрывает точку при showDot=false', () => {
    const { container } = render(<StatusBadge status="completed" showDot={false} />);
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('поддерживает кастомный лейбл', () => {
    render(<StatusBadge status="draft" label="WIP" />);
    expect(screen.getByText('WIP')).toBeInTheDocument();
  });
});
