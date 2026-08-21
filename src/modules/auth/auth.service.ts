import bcrypt from "bcrypt";
import type { LoginInput, RegisterSchoolInput } from "./auth.validation";
import { prisma } from "../../lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt";


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