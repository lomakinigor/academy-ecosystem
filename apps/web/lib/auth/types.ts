// TODO(core): replace with `import { SystemRole, AcademicLevel } from '@academy/db'`
// once Agent CORE publishes the Prisma client. Values mirror Prisma enums in CLAUDE.md.

export const SystemRole = {
  PRESIDENT: "PRESIDENT",
  VICE_PRESIDENT: "VICE_PRESIDENT",
  BRANCH_DIRECTOR: "BRANCH_DIRECTOR",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  STUDENT: "STUDENT",
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const AcademicLevel = {
  FOUNDER: "FOUNDER",
  MAGISTER: "MAGISTER",
  MASTER: "MASTER",
  LISTENER: "LISTENER",
} as const;
export type AcademicLevel = (typeof AcademicLevel)[keyof typeof AcademicLevel];

// Hierarchy weight: higher = more privileges. Used by requireRole / middleware.
export const SYSTEM_ROLE_RANK: Record<SystemRole, number> = {
  STUDENT: 0,
  BRANCH_ADMIN: 1,
  BRANCH_DIRECTOR: 2,
  VICE_PRESIDENT: 3,
  PRESIDENT: 4,
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  system_role: SystemRole;
  academic_level: AcademicLevel;
  branch_id: string | null;
  is_speaker: boolean;
}
