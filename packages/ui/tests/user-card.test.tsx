import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from '@/components/academy/user-card';
import { Button } from '@/components/primitives/button';

describe('UserCard', () => {
  it('отображает имя и инициалы при отсутствии фото', () => {
    render(<UserCard name="Виктор Светлов" level="founder" />);
    expect(screen.getByText('Виктор Светлов')).toBeInTheDocument();
    expect(screen.getByText('ВС')).toBeInTheDocument();
  });

  it('берёт максимум 2 инициала', () => {
    render(<UserCard name="Иван Петрович Сидоров" level="master" />);
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });

  it('показывает академический бейдж', () => {
    render(<UserCard name="Анна" level="magister" />);
    expect(screen.getByRole('img', { name: /Академический уровень: Магистр/i })).toBeInTheDocument();
  });

  it('показывает значок Спикер при is_speaker=true', () => {
    render(<UserCard name="Олег" level="master" isSpeaker />);
    expect(screen.getByText('Спикер')).toBeInTheDocument();
  });

  it('не показывает значок Спикер по умолчанию', () => {
    render(<UserCard name="Олег" level="master" />);
    expect(screen.queryByText('Спикер')).not.toBeInTheDocument();
  });

  it('склеивает subtitle и branchLabel через разделитель', () => {
    render(
      <UserCard name="Мария" level="listener" subtitle="Преподаватель" branchLabel="Москва" />,
    );
    expect(screen.getByText(/Преподаватель.*Москва/)).toBeInTheDocument();
  });

  it('рендерит actions-слот', () => {
    render(
      <UserCard
        name="Дмитрий"
        level="master"
        action={<Button size="sm">Открыть</Button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Открыть' })).toBeInTheDocument();
  });
});
