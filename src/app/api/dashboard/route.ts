import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 7-day range
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalMenu,
    activeMenu,
    todayOrders,
    todayRevenue,
    pendingOrders,
    recentOrders,
    ordersInRange,
    topMenuRaw,
    statusBreakdown,
  ] = await Promise.all([
    prisma.menu.count(),
    prisma.menu.count({ where: { available: true } }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order
      .aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { total: true },
      })
      .then((r) => r._sum.total ?? 0),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, customerName: true, status: true, total: true },
    }),
    // 7-day sales chart data
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    }),
    // Top menu (raw orderItems)
    prisma.orderItem.findMany({
      select: { menuId: true, menu: { select: { name: true, category: true } } },
    }),
    // Order status breakdown today
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startOfToday } },
      _count: { id: true },
    }),
  ]);

  // Build 7-day sales chart
  const salesMap = new Map<string, { orders: number; revenue: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    salesMap.set(key, { orders: 0, revenue: 0 });
  }
  for (const order of ordersInRange) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const entry = salesMap.get(key);
    if (entry) {
      entry.orders += 1;
      entry.revenue += order.total;
    }
  }
  const salesChart = Array.from(salesMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Build top 5 menu
  const menuCounts = new Map<number, { name: string; category: string; count: number }>();
  for (const item of topMenuRaw) {
    const existing = menuCounts.get(item.menuId);
    if (existing) {
      existing.count += 1;
    } else {
      menuCounts.set(item.menuId, {
        name: item.menu.name,
        category: item.menu.category,
        count: 1,
      });
    }
  }
  const topMenu = Array.from(menuCounts.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Order status breakdown
  const breakdown = { pending: 0, processing: 0, completed: 0 };
  for (const group of statusBreakdown) {
    if (group.status in breakdown) {
      breakdown[group.status as keyof typeof breakdown] = group._count.id;
    }
  }

  return NextResponse.json({
    totalMenu,
    activeMenu,
    todayOrders,
    todayRevenue,
    pendingOrders,
    recentOrders,
    salesChart,
    topMenu,
    orderStatusBreakdown: breakdown,
  });
}
