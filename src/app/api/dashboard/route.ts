import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending, assigned, inProgress, completedToday, total, recentCases] =
    await Promise.all([
      prisma.case.count({ where: { status: "PENDING" } }),
      prisma.case.count({ where: { status: "ASSIGNED" } }),
      prisma.case.count({ where: { status: "IN_PROGRESS" } }),
      prisma.case.count({
        where: { status: "COMPLETED", completedAt: { gte: todayStart } },
      }),
      prisma.case.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.case.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: { not: "CANCELLED" } },
        include: {
          handyman: { select: { name: true } },
        },
      }),
    ]);

  return NextResponse.json({
    stats: { pending, assigned, inProgress, completedToday, total },
    recentCases,
  });
}
