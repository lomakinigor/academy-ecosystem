import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/primitives/button';

describe('Button', () => {
  it('рендерит текст и реагирует на клик', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Сохранить</Button>);

    const btn = screen.getByRole('button', { name: 'Сохранить' });
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('блокирует клик при disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Off
      </Button>,
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('применяет accent variant классы', () => {
    render(<Button variant="accent">CTA</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-brand-accent');
  });

  it('asChild рендерит произвольный элемент с classes', () => {
    render(
      <Button asChild>
        <a href="/login">Войти</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Войти' });
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('inline-flex');
  });
});
