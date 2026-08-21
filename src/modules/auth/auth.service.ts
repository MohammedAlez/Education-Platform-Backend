import bcrypt from "bcrypt";
// import { prisma } from "../../lib/prisma";
import type { RegisterSchoolInput } from "./auth.validation";
import { prisma } from "../../lib/prisma";

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