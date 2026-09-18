import { prisma } from "../../lib/prisma";

export const getDashboardStats = async (schoolId: string) => {
  const now = new Date();
  
  // Start of current month (e.g., 2026-09-01)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Start of previous month (e.g., 2026-08-01)
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Run database queries concurrently for optimal performance
  const [
    totalStudents,
    studentsCreatedThisMonth,
    activeTeachers,
    activeClasses,
    currentMonthPayments,
  ] = await Promise.all([
    // 1. Total Active Students
    prisma.student.count({
      where: {
        schoolId,
        status: "ACTIVE",
      },
    }),

    // 2. New Active Students added this month
    prisma.student.count({
      where: {
        schoolId,
        status: "ACTIVE",
        createdAt: {
          gte: startOfCurrentMonth,
        },
      },
    }),

    // 3. Active Teachers
    prisma.teacher.count({
      where: {
        schoolId,
        status: "ACTIVE",
      },
    }),

    // 4. Active Classes (Classes with at least one active enrollment)
    prisma.class.count({
      where: {
        schoolId,
        enrollments: {
          some: {
            status: "ACTIVE",
          },
        },
      },
    }),

    // 5. Revenue collected this month (Sum of PAID payments)
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        student: {
          schoolId,
        },
        status: "PAID",
        paidAt: {
          gte: startOfCurrentMonth,
        },
      },
    }),
  ]);

  return {
    totalStudents,
    studentsGrowthThisMonth: studentsCreatedThisMonth,
    activeTeachers,
    activeClasses,
    revenueThisMonth: Number(currentMonthPayments._sum.amount || 0),
  };
};


export const getTodayAttendance = async (schoolId: string) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Group today's attendance entries by status for the current school
  const attendanceCounts = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      date: {
        gte: startOfToday,
        lte: endOfToday,
      },
      student: {
        schoolId,
      },
    },
    _count: {
      _all: true,
    },
  });

  // Map database results into key-value counts
  const result = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  attendanceCounts.forEach((item) => {
    if (item.status === "PRESENT") result.present = item._count._all;
    if (item.status === "ABSENT") result.absent = item._count._all;
    if (item.status === "LATE") result.late = item._count._all;
    if (item.status === "EXCUSED") result.excused = item._count._all;
  });

  return {
    present: result.present,
    absent: result.absent,
    late: result.late,
  };
};


// Helper to format days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 3. Weekly Attendance Trend (Current Week)
export const getWeeklyAttendanceTrend = async (schoolId: string) => {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Calculate Monday of the current week
  const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate Friday of the current week
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      date: {
        gte: monday,
        lte: friday,
      },
      student: {
        schoolId,
      },
    },
    select: {
      date: true,
      status: true,
    },
  });

  // Initialize Mon-Fri map
  const weeklyMap = new Map<
    string,
    { day: string; present: number; absent: number; late: number }
  >();

  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayName = DAY_NAMES[dayDate.getDay()]!;

    weeklyMap.set(dayName, {
      day: dayName,
      present: 0,
      absent: 0,
      late: 0,
    });
  }

  // Populate actual database counts into matching weekday buckets
  attendanceRecords.forEach((record) => {
    const dayName = DAY_NAMES[new Date(record.date).getDay()]!;
    const entry = weeklyMap.get(dayName);

    if (entry) {
      if (record.status === "PRESENT") entry.present++;
      if (record.status === "ABSENT") entry.absent++;
      if (record.status === "LATE") entry.late++;
    }
  });

  return Array.from(weeklyMap.values());
};

// 4. Recent Students
export const getRecentStudents = async (schoolId: string, limit: number = 4) => {
  const students = await prisma.student.findMany({
    where: {
      schoolId,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
      enrollments: {
        where: {
          status: "ACTIVE",
        },
        select: {
          class: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  return students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    className: s.enrollments[0]?.class?.name || "N/A",
    status: s.status,
    joinedAt: s.createdAt,
  }));
};

// 5. Recent Payments
export const getRecentPayments = async (schoolId: string, limit: number = 4) => {
  const payments = await prisma.payment.findMany({
    where: {
      student: {
        schoolId,
      },
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return payments.map((p) => ({
    id: p.id,
    studentName: `${p.student.firstName} ${p.student.lastName}`,
    amount: Number(p.amount),
    currency: "DA",
    status: p.status,
    createdAt: p.createdAt,
  }));
};