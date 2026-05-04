import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { SystemRole, AcademicLevel } from "@/lib/auth/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      system_role: SystemRole;
      academic_level: AcademicLevel;
      branch_id: string | null;
      is_speaker: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    system_role: SystemRole;
    academic_level: AcademicLevel;
    branch_id: string | null;
    is_speaker: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    system_role: SystemRole;
    academic_level: AcademicLevel;
    branch_id: string | null;
    is_speaker: boolean;
  }
}
