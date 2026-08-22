import { email, z } from "zod";

export const registerSchoolSchema = z.object({
  school: z.object({
    name: z.string().trim().min(2).max(100),
    address: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email(),
  }),

  admin: z.object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
  }),
});


export const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
})

export type RegisterSchoolInput = z.infer<
  typeof registerSchoolSchema
>;

export type LoginInput = z.infer<
    typeof loginSchema
>;

export type RefreshTokenInput = z.infer<
  typeof refreshTokenSchema
>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
  })
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message:
        "New password must be different from current password",
      path: ["newPassword"],
    }
  );