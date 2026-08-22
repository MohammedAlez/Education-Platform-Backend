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

export const registerSchool = async (
  data: RegisterSchoolInput
) => {
  const { school, admin } = data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: admin.email,
    },
  });

  const existingSchool = await prisma.school.findUnique({
    where:{
        email:school.email
    }
  })

  if (existingUser || existingSchool) {
    throw new Error("Admin or school email is already registered");
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

    const createdAdmin = await tx.user.create({
      data: {
        email: admin.email,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        schoolId: createdSchool.id,
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
    where: {
      email,
    },
    include: {
      school: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive");
  }

  if (user.school.status !== "ACTIVE") {
    throw new Error("Your school account is inactive");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
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
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
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
    throw new Error("Invalid or expired refresh token");
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
    throw new Error("Invalid refresh token");
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

    throw new Error(
      "Refresh token reuse detected. Please log in again."
    );
  }

  /*
   * Make sure the user and school are still active.
   */
  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive");
  }

  if (user.school.status !== "ACTIVE") {
    throw new Error("Your school account is inactive");
  }

  /*
   * Make sure the token belongs to the user
   * contained in the JWT.
   */
  if (storedToken.userId !== payload.userId) {
    throw new Error("Invalid refresh token");
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
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    schoolId: user.schoolId,
    school: {
      id: user.school.id,
      name: user.school.name,
      status: user.school.status,
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
    return;
  }

  if (storedToken.revokedAt) {
    return;
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
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordCorrect) {
    throw new Error("Current password is incorrect");
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