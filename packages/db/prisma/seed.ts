import {
  PrismaClient,
  SystemRole,
  AcademicLevel,
  EventType,
  EventStatus,
  PricingType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Единый dev-пароль для всех seed-юзеров.
// В проде регистрация будет хэшировать индивидуальные пароли.
const DEV_PASSWORD = "academy123";

async function main() {
  console.log("🌱 Seeding Academy database...");

  const passwordHash = bcrypt.hashSync(DEV_PASSWORD, 8);
  console.log(`✓ Dev password "${DEV_PASSWORD}" hashed for all seed users`);

  // ── Branches ─────────────────────────────────────────────
  const moscow = await prisma.branch.upsert({
    where: { id: "branch_moscow" },
    update: {
      name: "Академия Светлова — Москва",
      address: "г. Москва, ул. Тверская, 12, стр. 4, 3 этаж",
      entrance_code: "К1234",
      contact_phones: ["+7 (495) 123-45-67", "+7 (903) 555-12-34"],
      timezone: "Europe/Moscow",
    },
    create: {
      id: "branch_moscow",
      name: "Академия Светлова — Москва",
      city: "Москва",
      country: "RU",
      address: "г. Москва, ул. Тверская, 12, стр. 4, 3 этаж",
      entrance_code: "К1234",
      contact_phones: ["+7 (495) 123-45-67", "+7 (903) 555-12-34"],
      timezone: "Europe/Moscow",
    },
  });

  const yekaterinburg = await prisma.branch.upsert({
    where: { id: "branch_yekaterinburg" },
    update: {
      name: "Академия Светлова — Екатеринбург",
      address: "г. Екатеринбург, ул. Малышева, 84, оф. 215",
      entrance_code: "5678",
      contact_phones: ["+7 (343) 222-33-44"],
      timezone: "Asia/Yekaterinburg",
    },
    create: {
      id: "branch_yekaterinburg",
      name: "Академия Светлова — Екатеринбург",
      city: "Екатеринбург",
      country: "RU",
      address: "г. Екатеринбург, ул. Малышева, 84, оф. 215",
      entrance_code: "5678",
      contact_phones: ["+7 (343) 222-33-44"],
      timezone: "Asia/Yekaterinburg",
    },
  });

  const chelyabinsk = await prisma.branch.upsert({
    where: { id: "branch_chelyabinsk" },
    update: {
      name: "Академия Светлова — Челябинск",
      address: "г. Челябинск, пр. Ленина, 55, БЦ «Радуга», 4 этаж",
      entrance_code: "9012",
      contact_phones: ["+7 (351) 777-88-99", "+7 (904) 800-11-22"],
      timezone: "Asia/Yekaterinburg",
    },
    create: {
      id: "branch_chelyabinsk",
      name: "Академия Светлова — Челябинск",
      city: "Челябинск",
      country: "RU",
      address: "г. Челябинск, пр. Ленина, 55, БЦ «Радуга», 4 этаж",
      entrance_code: "9012",
      contact_phones: ["+7 (351) 777-88-99", "+7 (904) 800-11-22"],
      timezone: "Asia/Yekaterinburg",
    },
  });

  console.log(`✓ Branches: ${moscow.city}, ${yekaterinburg.city}, ${chelyabinsk.city}`);

  // ── Users ────────────────────────────────────────────────
  const founder = await prisma.user.upsert({
    where: { email: "svetlov@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "svetlov@academy.ru",
      name: "В.Ю. Светлов",
      system_role: SystemRole.PRESIDENT,
      academic_level: AcademicLevel.FOUNDER,
      is_speaker: true,
      branch_id: moscow.id,
      referral_code: "FOUNDER",
    },
  });

  const vicePresident = await prisma.user.upsert({
    where: { email: "vp@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "vp@academy.ru",
      name: "Анна Вице-президент",
      system_role: SystemRole.VICE_PRESIDENT,
      academic_level: AcademicLevel.MAGISTER,
      is_speaker: true,
      branch_id: moscow.id,
      referral_code: "VP01",
    },
  });

  const directorMsk = await prisma.user.upsert({
    where: { email: "director.msk@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "director.msk@academy.ru",
      name: "Иван Директор (Москва)",
      system_role: SystemRole.BRANCH_DIRECTOR,
      academic_level: AcademicLevel.MAGISTER,
      is_speaker: true,
      branch_id: moscow.id,
      referral_code: "DIRMSK",
    },
  });

  const directorEkb = await prisma.user.upsert({
    where: { email: "director.ekb@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "director.ekb@academy.ru",
      name: "Ольга Директор (Екатеринбург)",
      system_role: SystemRole.BRANCH_DIRECTOR,
      academic_level: AcademicLevel.MAGISTER,
      is_speaker: true,
      branch_id: yekaterinburg.id,
      referral_code: "DIREKB",
    },
  });

  const adminChel = await prisma.user.upsert({
    where: { email: "admin.chel@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "admin.chel@academy.ru",
      name: "Мария Админ (Челябинск)",
      system_role: SystemRole.BRANCH_ADMIN,
      academic_level: AcademicLevel.MASTER,
      is_speaker: true,
      branch_id: chelyabinsk.id,
      referral_code: "ADMCHEL",
    },
  });

  const masterChel = await prisma.user.upsert({
    where: { email: "master.chel@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "master.chel@academy.ru",
      name: "Пётр Мастер (Челябинск)",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.MASTER,
      is_speaker: true,
      branch_id: chelyabinsk.id,
      referral_code: "MSTCHEL",
    },
  });

  const masterEkb = await prisma.user.upsert({
    where: { email: "master.ekb@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "master.ekb@academy.ru",
      name: "Дмитрий Мастер (Екатеринбург)",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.MASTER,
      is_speaker: true,
      branch_id: yekaterinburg.id,
      referral_code: "MSTEKB",
    },
  });

  const listenerMsk = await prisma.user.upsert({
    where: { email: "listener.msk@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "listener.msk@academy.ru",
      name: "Елена Слушатель (Москва)",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.LISTENER,
      is_speaker: false,
      branch_id: moscow.id,
      referral_code: "LSTMSK",
    },
  });

  const listenerChel = await prisma.user.upsert({
    where: { email: "listener.chel@academy.ru" },
    update: { password_hash: passwordHash },
    create: {
      password_hash: passwordHash,
      email: "listener.chel@academy.ru",
      name: "Сергей Слушатель (Челябинск)",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.LISTENER,
      is_speaker: false,
      branch_id: chelyabinsk.id,
      referral_code: "LSTCHEL",
    },
  });

  console.log(
    `✓ Users: ${[founder, vicePresident, directorMsk, directorEkb, adminChel, masterChel, masterEkb, listenerMsk, listenerChel].length}`,
  );

  // ── Speaker profiles ─────────────────────────────────────
  await prisma.speakerProfile.upsert({
    where: { user_id: founder.id },
    update: {},
    create: {
      user_id: founder.id,
      bio: "Основатель Академии Развития Человека. Автор методик личностного роста.",
      specialties: ["Философия развития", "Лидерство", "Самопознание"],
      rating: 5.0,
    },
  });

  await prisma.speakerProfile.upsert({
    where: { user_id: directorMsk.id },
    update: {},
    create: {
      user_id: directorMsk.id,
      bio: "Магистр Академии. Ведёт курсы по управлению и стратегии.",
      specialties: ["Стратегия", "Управление командой"],
      rating: 4.8,
    },
  });

  await prisma.speakerProfile.upsert({
    where: { user_id: directorEkb.id },
    update: {},
    create: {
      user_id: directorEkb.id,
      bio: "Магистр. Семейные расстановки и системные практики.",
      specialties: ["Расстановки", "Семейные системы"],
      rating: 4.9,
    },
  });

  await prisma.speakerProfile.upsert({
    where: { user_id: masterChel.id },
    update: {},
    create: {
      user_id: masterChel.id,
      bio: "Мастер. Практик трансформационных тренингов.",
      specialties: ["Практики", "Психология"],
      rating: 4.7,
    },
  });

  await prisma.speakerProfile.upsert({
    where: { user_id: masterEkb.id },
    update: {},
    create: {
      user_id: masterEkb.id,
      bio: "Мастер. Телесные практики и работа с дыханием.",
      specialties: ["Телесные практики", "Дыхание"],
      rating: 4.6,
    },
  });

  console.log("✓ Speaker profiles");

  // ── Events ───────────────────────────────────────────────
  // Очищаем старые, чтобы пересеять с обновлённой схемой
  await prisma.booking.deleteMany({});
  await prisma.event.deleteMany({});

  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const at = (offsetDays: number, hour: number, minute = 0) => {
    const d = new Date(today.getTime() + offsetDays * DAY);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const plus = (date: Date, hours: number) => new Date(date.getTime() + hours * HOUR);

  type EventInput = Parameters<typeof prisma.event.create>[0]["data"];

  const events: EventInput[] = [
    // ── Прошлые (история, completed) ───────────────────────
    {
      title: "Семинар: Введение в систему Светлова",
      description: "Обзорная лекция для начинающих слушателей.",
      type: EventType.SEMINAR,
      status: EventStatus.COMPLETED,
      start_at: at(-7, 19),
      end_at: at(-7, 22),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 100,
      pricing_type: PricingType.FIXED,
      price: 3500,
      is_online: false,
      tags: ["открытое занятие"],
    },
    {
      title: "Практика: работа с состояниями",
      description: "Групповая практика для слушателей.",
      type: EventType.PRACTICE,
      status: EventStatus.COMPLETED,
      start_at: at(-5, 18, 30),
      end_at: at(-5, 21, 30),
      speaker_id: masterChel.id,
      branch_id: chelyabinsk.id,
      max_participants: 30,
      pricing_type: PricingType.FIXED,
      price: 2500,
      is_online: false,
      tags: [],
    },
    {
      title: "Вебинар: онлайн-знакомство с Академией",
      description: "Открытый онлайн-вебинар для тех, кто хочет узнать о школе.",
      type: EventType.WEBINAR,
      status: EventStatus.COMPLETED,
      start_at: at(-3, 20),
      end_at: at(-3, 22),
      speaker_id: vicePresident.id,
      branch_id: null,
      max_participants: 500,
      pricing_type: PricingType.FREE,
      is_online: true,
      tags: ["открытое занятие"],
    },

    // ── Активные (на этой неделе) ──────────────────────────
    {
      title: "Мастер-класс: лидерство и принятие решений",
      description: "Авторский мастер-класс для магистров и мастеров.",
      type: EventType.MASTERCLASS,
      status: EventStatus.ACTIVE,
      start_at: at(0, 19),
      end_at: at(0, 22),
      speaker_id: directorMsk.id,
      branch_id: moscow.id,
      max_participants: 50,
      pricing_type: PricingType.FIXED,
      price: 7500,
      is_online: false,
      tags: ["допуск после знакомства"],
    },
    {
      title: "Расстановки: семейные системы",
      description: "Практика семейных расстановок в малой группе.",
      type: EventType.PRACTICE,
      status: EventStatus.ACTIVE,
      start_at: at(1, 18),
      end_at: at(1, 22),
      speaker_id: directorEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 12,
      pricing_type: PricingType.FIXED,
      price: 5000,
      is_online: false,
      tags: ["допуск после знакомства"],
    },
    {
      title: "Тайский массаж: базовый курс, занятие 1",
      description: "Первое занятие восьминедельного курса по тайскому массажу.",
      type: EventType.COURSE,
      status: EventStatus.ACTIVE,
      start_at: at(2, 19),
      end_at: at(2, 22),
      speaker_id: masterEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 16,
      pricing_type: PricingType.FIXED,
      price: 4000,
      pricing_note: "Полный курс — 28 000 ₽ при оплате до старта",
      is_online: false,
      tags: [],
      program_id: "course_thai_massage_basic",
    },

    // ── Многодневный семинар «ХРАМ-3» (program_id) ─────────
    {
      title: "Храм-3: день 1 — Очищение",
      description: "Первый день трёхдневного семинара. Подготовка и вход в практику.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(5, 10),
      end_at: at(5, 19),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 80,
      pricing_type: PricingType.FIXED,
      price: 29000,
      pricing_note: "До 15.05 — 29 000 ₽, далее — 32 000 ₽",
      is_online: false,
      tags: ["допуск после знакомства"],
      program_id: "seminar_temple_3",
    },
    {
      title: "Храм-3: день 2 — Сонастройка",
      description: "Второй день семинара ХРАМ-3.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(6, 10),
      end_at: at(6, 19),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 80,
      pricing_type: PricingType.FIXED,
      price: 0,
      pricing_note: "Включено в стоимость семинара ХРАМ-3",
      is_online: false,
      tags: ["допуск после знакомства"],
      program_id: "seminar_temple_3",
    },
    {
      title: "Храм-3: день 3 — Интеграция",
      description: "Завершающий день семинара ХРАМ-3.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(7, 10),
      end_at: at(7, 19),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 80,
      pricing_type: PricingType.FIXED,
      price: 0,
      pricing_note: "Включено в стоимость семинара ХРАМ-3",
      is_online: false,
      tags: ["допуск после знакомства"],
      program_id: "seminar_temple_3",
    },
    {
      title: "Храм-3: круг последователей",
      description: "Закрытая встреча после ХРАМ-3 для прошедших семинар.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: at(10, 19),
      end_at: at(10, 22),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 80,
      pricing_type: PricingType.DONATION,
      pricing_note: "Минимум 1500 ₽",
      is_online: false,
      tags: ["допуск после знакомства"],
      program_id: "seminar_temple_3",
    },

    // ── Недельная программа ────────────────────────────────
    {
      title: "Семинар: Принципы взаимодействия",
      description: "Открытый семинар о принципах построения отношений.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(3, 19),
      end_at: at(3, 22),
      speaker_id: directorMsk.id,
      branch_id: moscow.id,
      max_participants: 60,
      pricing_type: PricingType.FIXED,
      price: 2500,
      is_online: false,
      tags: ["открытое занятие"],
    },
    {
      title: "Практика: работа с границами",
      description: "Групповая практика для слушателей.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: at(4, 18, 30),
      end_at: at(4, 21, 30),
      speaker_id: masterChel.id,
      branch_id: chelyabinsk.id,
      max_participants: 24,
      pricing_type: PricingType.FIXED,
      price: 2500,
      is_online: false,
      tags: [],
    },
    {
      title: "Вебинар: ответы на вопросы об академии",
      description: "Онлайн-встреча для всех желающих.",
      type: EventType.WEBINAR,
      status: EventStatus.PLANNED,
      start_at: at(8, 20),
      end_at: at(8, 21, 30),
      speaker_id: vicePresident.id,
      branch_id: null,
      max_participants: 1000,
      pricing_type: PricingType.FREE,
      is_online: true,
      tags: ["открытое занятие"],
    },
    {
      title: "Семинар выходного дня (с детьми)",
      description: "Семейный формат — можно с детьми, есть детская комната.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(9, 11),
      end_at: at(9, 17),
      speaker_id: directorEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 40,
      pricing_type: PricingType.FIXED,
      price: 4500,
      pricing_note: "Дети до 12 лет бесплатно",
      is_online: false,
      tags: ["с детьми", "открытое занятие"],
    },

    // ── Двухнедельный диапазон ─────────────────────────────
    {
      title: "Практика: телесные настройки",
      description: "Утренняя практика в Екатеринбурге.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: at(11, 8),
      end_at: at(11, 10),
      speaker_id: masterEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 20,
      pricing_type: PricingType.DONATION,
      pricing_note: "Минимум 500 ₽",
      is_online: false,
      tags: [],
    },
    {
      title: "Курс: Тайский массаж, занятие 2",
      description: "Второе занятие курса.",
      type: EventType.COURSE,
      status: EventStatus.PLANNED,
      start_at: at(12, 19),
      end_at: at(12, 22),
      speaker_id: masterEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 16,
      pricing_type: PricingType.FIXED,
      price: 4000,
      is_online: false,
      tags: [],
      program_id: "course_thai_massage_basic",
    },
    {
      title: "Семинар: Энергии и состояния",
      description: "Базовый семинар по работе с состояниями.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(13, 19),
      end_at: at(13, 22),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 100,
      pricing_type: PricingType.FIXED,
      price: 3500,
      is_online: false,
      tags: ["открытое занятие"],
    },
    {
      title: "Мастер-класс: онлайн-разбор кейсов",
      description: "Онлайн-разбор кейсов слушателей.",
      type: EventType.MASTERCLASS,
      status: EventStatus.PLANNED,
      start_at: at(14, 20),
      end_at: at(14, 22),
      speaker_id: directorMsk.id,
      branch_id: null,
      max_participants: 200,
      pricing_type: PricingType.FIXED,
      price: 1500,
      is_online: true,
      tags: [],
    },
    {
      title: "Практика расстановок (открытая)",
      description: "Открытая группа расстановок.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: at(15, 18),
      end_at: at(15, 22),
      speaker_id: directorEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 14,
      pricing_type: PricingType.FIXED,
      price: 4500,
      is_online: false,
      tags: ["открытое занятие"],
    },

    // ── Третья неделя — ретриты, поездки ───────────────────
    {
      title: "Ретрит «Тишина» (3 дня)",
      description: "Трёхдневный ретрит молчания в Подмосковье.",
      type: EventType.RETREAT,
      status: EventStatus.PLANNED,
      start_at: at(18, 17),
      end_at: at(20, 16),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 25,
      pricing_type: PricingType.FIXED,
      price: 28000,
      pricing_note: "Включает проживание и питание",
      is_online: false,
      tags: ["допуск после знакомства"],
    },
    {
      title: "Курс: Тайский массаж, занятие 3",
      description: "Третье занятие курса.",
      type: EventType.COURSE,
      status: EventStatus.PLANNED,
      start_at: at(19, 19),
      end_at: at(19, 22),
      speaker_id: masterEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 16,
      pricing_type: PricingType.FIXED,
      price: 4000,
      is_online: false,
      tags: [],
      program_id: "course_thai_massage_basic",
    },
    {
      title: "Семинар СВЕТЛОЯР (открытие)",
      description: "Открытие летнего фестиваля СВЕТЛОЯР — общеакадемическое событие, все филиалы.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(21, 11),
      end_at: at(21, 19),
      speaker_id: founder.id,
      branch_id: null,
      max_participants: 500,
      pricing_type: PricingType.FIXED,
      price: 12000,
      pricing_note: "До 30.05 — 12 000 ₽, далее — 15 000 ₽",
      is_online: false,
      tags: ["СВЕТЛОЯР", "с детьми"],
    },
    {
      title: "Путешествие: Алтай (10 дней)",
      description: "Выездной интенсив на Алтае с практиками на природе.",
      type: EventType.TRIP,
      status: EventStatus.PLANNED,
      start_at: at(22, 6),
      end_at: at(31, 22),
      speaker_id: founder.id,
      branch_id: chelyabinsk.id,
      max_participants: 25,
      pricing_type: PricingType.FIXED,
      price: 95000,
      pricing_note: "Без учёта перелёта",
      is_online: false,
      tags: ["допуск после знакомства"],
    },

    // ── Четвёртая неделя ───────────────────────────────────
    {
      title: "Аттестация: переход на уровень Мастер",
      description: "Аттестационное мероприятие для слушателей-кандидатов.",
      type: EventType.GRADING,
      status: EventStatus.DRAFT,
      start_at: at(25, 10),
      end_at: at(25, 18),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 20,
      pricing_type: PricingType.FIXED,
      price: 12000,
      is_grading: true,
      is_online: false,
      tags: [],
    },
    {
      title: "Вебинар: разбор практик месяца",
      description: "Ежемесячный онлайн-разбор для слушателей.",
      type: EventType.WEBINAR,
      status: EventStatus.PLANNED,
      start_at: at(26, 20),
      end_at: at(26, 21, 30),
      speaker_id: vicePresident.id,
      branch_id: null,
      max_participants: 1000,
      pricing_type: PricingType.FREE,
      is_online: true,
      tags: [],
    },
    {
      title: "Практика: работа с напряжениями",
      description: "Групповая практика для слушателей.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: at(27, 18, 30),
      end_at: at(27, 21, 30),
      speaker_id: masterChel.id,
      branch_id: chelyabinsk.id,
      max_participants: 24,
      pricing_type: PricingType.FIXED,
      price: 2500,
      is_online: false,
      tags: [],
    },
    {
      title: "Семинар: Принципы намерения",
      description: "Авторский семинар В.Ю. Светлова в Екатеринбурге.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: at(28, 19),
      end_at: at(28, 22),
      speaker_id: founder.id,
      branch_id: yekaterinburg.id,
      max_participants: 80,
      pricing_type: PricingType.FIXED,
      price: 4500,
      is_online: false,
      tags: ["открытое занятие"],
    },
    {
      title: "Курс: Тайский массаж, занятие 4",
      description: "Четвёртое занятие курса.",
      type: EventType.COURSE,
      status: EventStatus.PLANNED,
      start_at: at(29, 19),
      end_at: at(29, 22),
      speaker_id: masterEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 16,
      pricing_type: PricingType.FIXED,
      price: 4000,
      is_online: false,
      tags: [],
      program_id: "course_thai_massage_basic",
    },
    {
      title: "Мастер-класс по расстановкам (для практикующих)",
      description: "Закрытый формат для тех, кто прошёл базовый курс.",
      type: EventType.MASTERCLASS,
      status: EventStatus.PLANNED,
      start_at: at(30, 11),
      end_at: at(30, 18),
      speaker_id: directorEkb.id,
      branch_id: yekaterinburg.id,
      max_participants: 12,
      pricing_type: PricingType.FIXED,
      price: 8000,
      is_online: false,
      tags: ["допуск после знакомства"],
    },
  ];

  for (const data of events) {
    await prisma.event.create({ data });
  }

  console.log(`✓ Events: ${events.length}`);

  // ── Bookings (несколько участников на нескольких событиях) ─
  const eventList = await prisma.event.findMany({
    where: {
      status: { in: [EventStatus.PLANNED, EventStatus.ACTIVE] },
    },
    take: 6,
  });

  for (const ev of eventList) {
    for (const u of [listenerMsk, listenerChel]) {
      await prisma.booking.upsert({
        where: { user_id_event_id: { user_id: u.id, event_id: ev.id } },
        update: {},
        create: { user_id: u.id, event_id: ev.id, status: "CONFIRMED" },
      });
    }
  }
  console.log("✓ Bookings");

  // ── ExecutorBalance для спикеров ─────────────────────────
  for (const speaker of [founder, directorMsk, directorEkb, masterChel, masterEkb]) {
    await prisma.executorBalance.upsert({
      where: { user_id: speaker.id },
      update: {},
      create: {
        user_id: speaker.id,
        accrued: 0,
        paid: 0,
        pending: 0,
      },
    });
  }
  console.log("✓ Executor balances");

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
