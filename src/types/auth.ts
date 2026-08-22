export type UserRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  schoolId: string;
}

export interface RefreshTokenPayload {
  userId: string;
}