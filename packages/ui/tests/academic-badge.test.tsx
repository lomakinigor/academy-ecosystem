import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AcademicBadge } from '@/components/academy/academic-badge';

describe('AcademicBadge', () => {
  it('рендерит лейбл по умолчанию для каждого уровня', () => {
    const cases = [
      ['founder', 'Основатель'],
      ['magister', 'Магистр'],
      ['master', 'Мастер'],
      ['listener', 'Слушатель'],
    ] as const;

    for (const [level, label] of cases) {
      const { unmount } = render(<AcademicBadge level={level} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('предоставляет доступное aria-label с уровнем', () => {
    render(<AcademicBadge level="magister" />);
    const badge = screen.getByRole('img', { name: /Академический уровень: Магистр/i });
    expect(badge).toHaveAttribute('data-level', 'magister');
  });

  it('скрывает текст при showLabel=false но сохраняет aria-label', () => {
    render(<AcademicBadge level="founder" showLabel={false} />);
    expect(screen.queryByText('Основатель')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Основатель/i })).toBeInTheDocument();
  });

  it('позволяет переопределить лейбл через prop', () => {
    render(<AcademicBadge level="master" label="Senior Master" />);
    expect(screen.getByText('Senior Master')).toBeInTheDocument();
  });

  it('применяет пользовательский className', () => {
    render(<AcademicBadge level="listener" className="custom-x" />);
    expect(screen.getByRole('img')).toHaveClass('custom-x');
  });
});
