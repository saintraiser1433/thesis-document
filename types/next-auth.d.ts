import NextAuth from "next-auth"

export type UserRole = "ADMIN" | "PROGRAM_HEAD" | "TEACHER" | "STUDENT" | "PEER_REVIEWER"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: import("./next-auth").UserRole
  }
}
