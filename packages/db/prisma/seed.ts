import {
  PrismaClient,
  SystemRole,
  AcademicLevel,
  EventType,
  EventStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Academy database...");

  // ── Branches ───────────────────────────────────────────────
  const moscow = await prisma.branch.upsert({
    where: { id: "branch_moscow" },
    update: {},
    create: {
      id: "branch_moscow",
      name: "Академия Светлова — Москва",
      city: "Москва",
      country: "RU",
    },
  });

  const chelyabinsk = await prisma.branch.upsert({
    where: { id: "branch_chelyabinsk" },
    update: {},
    create: {
      id: "branch_chelyabinsk",
      name: "Академия Светлова — Челябинск",
      city: "Челябинск",
      country: "RU",
    },
  });

  console.log(`✓ Branches: ${moscow.city}, ${chelyabinsk.city}`);

  // ── Users (по одному на каждую роль/уровень) ──────────────
  const founder = await prisma.user.upsert({
    where: { email: "svetlov@academy.ru" },
    update: {},
    create: {
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
    update: {},
    create: {
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
    update: {},
    create: {
      email: "director.msk@academy.ru",
      name: "Иван Директор (Москва)",
      system_role: SystemRole.BRANCH_DIRECTOR,
      academic_level: AcademicLevel.MAGISTER,
      is_speaker: true,
      branch_id: moscow.id,
      referral_code: "DIRMSK",
    },
  });

  const adminChel = await prisma.user.upsert({
    where: { email: "admin.chel@academy.ru" },
    update: {},
    create: {
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
    update: {},
    create: {
      email: "master.chel@academy.ru",
      name: "Пётр Мастер (Челябинск)",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.MASTER,
      is_speaker: true,
      branch_id: chelyabinsk.id,
      referral_code: "MSTCHEL",
    },
  });

  const listenerMsk = await prisma.user.upsert({
    where: { email: "listener.msk@academy.ru" },
    update: {},
    create: {
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
    update: {},
    create: {
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
    `✓ Users: ${[founder, vicePresident, directorMsk, adminChel, masterChel, listenerMsk, listenerChel].length}`,
  );

  // ── Speaker profiles ───────────────────────────────────────
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
    where: { user_id: masterChel.id },
    update: {},
    create: {
      user_id: masterChel.id,
      bio: "Мастер. Практик трансформационных тренингов.",
      specialties: ["Практики", "Психология"],
      rating: 4.7,
    },
  });

  console.log("✓ Speaker profiles");

  // ── Events (5 разных типов) ────────────────────────────────
  const now = new Date();
  const inDays = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const events = [
    {
      id: "evt_seminar_msk",
      title: "Семинар: Введение в систему Светлова",
      description: "Обзорная лекция для начинающих слушателей.",
      type: EventType.SEMINAR,
      status: EventStatus.PLANNED,
      start_at: inDays(7),
      end_at: new Date(inDays(7).getTime() + 3 * 60 * 60 * 1000),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 100,
      price: 3500,
      is_grading: false,
    },
    {
      id: "evt_practice_chel",
      title: "Практика: работа с состояниями",
      description: "Групповая практика для слушателей и мастеров.",
      type: EventType.PRACTICE,
      status: EventStatus.PLANNED,
      start_at: inDays(10),
      end_at: new Date(inDays(10).getTime() + 4 * 60 * 60 * 1000),
      speaker_id: masterChel.id,
      branch_id: chelyabinsk.id,
      max_participants: 30,
      price: 2500,
      is_grading: false,
    },
    {
      id: "evt_masterclass_msk",
      title: "Мастер-класс: лидерство и принятие решений",
      description: "Авторский мастер-класс для магистров и мастеров.",
      type: EventType.MASTERCLASS,
      status: EventStatus.ACTIVE,
      start_at: inDays(2),
      end_at: new Date(inDays(2).getTime() + 6 * 60 * 60 * 1000),
      speaker_id: directorMsk.id,
      branch_id: moscow.id,
      max_participants: 50,
      price: 7500,
      is_grading: false,
    },
    {
      id: "evt_trip_chel",
      title: "Выездной интенсив на Урале",
      description: "Трёхдневный выездной интенсив с практиками на природе.",
      type: EventType.TRIP,
      status: EventStatus.PLANNED,
      start_at: inDays(30),
      end_at: inDays(33),
      speaker_id: founder.id,
      branch_id: chelyabinsk.id,
      max_participants: 25,
      price: 35000,
      is_grading: false,
    },
    {
      id: "evt_grading_msk",
      title: "Аттестация: переход на уровень Мастер",
      description: "Аттестационное мероприятие для слушателей-кандидатов.",
      type: EventType.GRADING,
      status: EventStatus.DRAFT,
      start_at: inDays(45),
      end_at: new Date(inDays(45).getTime() + 8 * 60 * 60 * 1000),
      speaker_id: founder.id,
      branch_id: moscow.id,
      max_participants: 20,
      price: 12000,
      is_grading: true,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: event,
    });
  }

  console.log(`✓ Events: ${events.length}`);

  // ── ExecutorBalance для спикеров ───────────────────────────
  for (const speaker of [founder, directorMsk, masterChel]) {
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
