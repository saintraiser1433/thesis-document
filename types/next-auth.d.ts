import NextAuth from "next-auth"

export type UserRole = "ADMIN" | "PROGRAM_HEAD" | "TEACHER" | "STUDENT" | "PEER_REVIEWER"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      departmentId?: string | null
      departmentName?: string | null
    }
  }

  interface User {
    role: UserRole
    departmentId?: string | null
    departmentName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: import("./next-auth").UserRole
    departmentId?: string | null
    departmentName?: string | null
  }
}
