import bcrypt from "bcrypt";
import type { LoginInput, RefreshTokenInput, RegisterSchoolInput } from "./auth.validation";
import { prisma } from "../../lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { hashToken } from "../../utils/token";
import crypto from "crypto";
import { AppError } from "../../errors/app-error";

export const registerSchool = async (data: RegisterSchoolInput) => {
  const { school, admin } = data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: admin.email,
    },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const existingSchool = await prisma.school.findUnique({
    where: {
      email: school.email,
    },
  });

  if (existingSchool) {
    throw new AppError("School email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(admin.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const createdSchool = await tx.school.create({
      data: {
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        status: "ACTIVE",
      },
    });

    // const createdAdmin = await tx.user.create({
    //   data: {
    //     email: admin.email,
    //     passwordHash,
    //     role: "ADMIN",
    //     status: "ACTIVE",
    //     schoolId: createdSchool.id,
    //   },
    // });

    const createdAdmin = await tx.user.create({
      data: {
        email: admin.email,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        schoolId: createdSchool.id,

        admin: {
          create: {
            firstName: admin.firstName,
            lastName: admin.lastName,
            phone: admin.phone,
            schoolId: createdSchool.id,
          },
        },
      },
    });

    return {
      school: createdSchool,
      admin: createdAdmin,
    };
  });

  return {
    school: {
      id: result.school.id,
      name: result.school.name,
      address: result.school.address,
      phone: result.school.phone,
      email: result.school.email,
      status: result.school.status,
    },
    admin: {
      id: result.admin.id,
      email: result.admin.email,
      role: result.admin.role,
      status: result.admin.status,
    },
  };
};


export const login = async (data: LoginInput) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  // Generic message for security (don't reveal if email vs password failed)
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Safe navigation / existence check for user.school
  if (!user.school || user.school.status !== 'ACTIVE') {
    throw new AppError('Your school account is inactive', 403);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account is inactive', 403);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    schoolId: user.schoolId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      schoolId: user.schoolId,
    },
  };
};


export const refreshAccessToken = async (
  data: RefreshTokenInput
) => {
  const { refreshToken } = data;

  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        include: {
          school: true,
        },
      },
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = storedToken.user;

  /*
   * Refresh-token reuse detection
   */
  if (storedToken.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    throw new AppError(
      "Refresh token reuse detected. Please log in again.",
      401
    );
  }

  /*
   * Make sure the user and school are still active.
   */
  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is inactive", 403);
  }

  if (!user.school || user.school.status !== "ACTIVE") {
    throw new AppError("Your school account is inactive", 403);
  }

  /*
   * Make sure the token belongs to the user
   * contained in the JWT.
   */
  if (storedToken.userId !== payload.userId) {
    throw new AppError("Invalid refresh token", 401);
  }

  /*
   * Generate new tokens.
   */
  const newAccessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    schoolId: user.schoolId,
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.id,
  });

  const newTokenHash = hashToken(newRefreshToken);

  /*
   * Rotate refresh token atomically.
   */
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await tx.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      school: true,
      admin: true,
      teacher: true,
      student: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is inactive", 403);
  }

  if (!user.school || user.school.status !== "ACTIVE") {
    throw new AppError("Your school account is inactive", 403);
  }

  // return {
  //   id: user.id,
  //   email: user.email,
  //   role: user.role,
  //   status: user.status,
  //   schoolId: user.schoolId,
  //   school: {
  //     id: user.school.id,
  //     name: user.school.name,
  //     status: user.school.status,
  //   },
  // };

  const profile =
    user.role === "ADMIN"
      ? user.admin
      : user.role === "TEACHER"
        ? user.teacher
        : user.student;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    schoolId: user.schoolId,

    profile: profile
      ? {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }
      : null,

    school: {
      id: user.school.id,
      name: user.school.name,
      status: user.school.status,
      phone: user.school.phone,
      email: user.school.email
    },
  };
};

export const logout = async (
  userId: string,
  refreshToken: string
) => {
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId,
      tokenHash: refreshTokenHash,
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid or non-existent refresh token", 404);
  }

  if (storedToken.revokedAt) {
    throw new AppError("Token has already been revoked", 400);
  }

  await prisma.refreshToken.update({
    where: {
      id: storedToken.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is inactive", 403);
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordCorrect) {
    throw new AppError("Current password is incorrect", 400);
  }

  const newPasswordHash = await bcrypt.hash(
    newPassword,
    12
  );

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    await tx.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  });
};

