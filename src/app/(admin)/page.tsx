import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SalesChart from "@/components/sales-chart";

// ponytail: realistic daily target for small Indonesian cafe
const DAILY_TARGET = 500_000;

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
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
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      select: { menuId: true, menu: { select: { name: true, category: true } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startOfToday } },
      _count: { id: true },
    }),
  ]);

  // 7-day sales chart
  const salesMap = new Map<string, { orders: number; revenue: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    salesMap.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }
  for (const order of ordersInRange) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const entry = salesMap.get(key);
    if (entry) {
      entry.orders += 1;
      entry.revenue += order.total;
    }
  }
  const salesChart = Array.from(salesMap.entries()).map(([date, d]) => ({
    date,
    ...d,
  }));

  // Top 5 menu
  const menuCounts = new Map<
    number,
    { name: string; category: string; count: number }
  >();
  for (const item of topMenuRaw) {
    const existing = menuCounts.get(item.menuId);
    if (existing) existing.count += 1;
    else
      menuCounts.set(item.menuId, {
        name: item.menu.name,
        category: item.menu.category,
        count: 1,
      });
  }
  const topMenu = Array.from(menuCounts.entries())
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = Math.max(...topMenu.map((m) => m.count), 1);

  // Status breakdown today
  const breakdown = { pending: 0, processing: 0, completed: 0 };
  for (const g of statusBreakdown) {
    if (g.status in breakdown)
      breakdown[g.status as keyof typeof breakdown] = g._count.id;
  }
  const totalToday = breakdown.pending + breakdown.processing + breakdown.completed;

  const targetPct = Math.min((todayRevenue / DAILY_TARGET) * 100, 100);
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs text-warm-400 tracking-wide">{today}</p>
        <h2 className="text-2xl font-bold text-warm-800 mt-0.5">
          {greeting()}, {session.user?.username ?? "Admin"}
        </h2>
      </div>

      {/* Metric cards — asymmetric bento */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Revenue — big, with daily target */}
        <div className="col-span-2 lg:col-span-3 bg-warm-800 rounded-xl p-5 text-cream relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, #C67B5C 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative">
            <p className="text-xs text-warm-300 uppercase tracking-wider">
              Pendapatan Hari Ini
            </p>
            <p className="text-4xl font-bold mt-2 tracking-tight">
              {formatRp(todayRevenue)}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-warm-300 mb-1">
                <span>Target harian</span>
                <span>
                  {Math.round(targetPct)}% dari {formatRp(DAILY_TARGET)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-warm-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${targetPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending — urgency */}
        <div
          className={`col-span-1 rounded-xl p-5 border ${
            pendingOrders > 0
              ? "bg-warning/10 border-warning/40"
              : "bg-white border-warm-200"
          }`}
        >
          <p className="text-xs text-warm-500 uppercase tracking-wider">
            Perlu Diproses
          </p>
          <p
            className={`text-3xl font-bold mt-2 ${
              pendingOrders > 0 ? "text-warning" : "text-warm-800"
            }`}
          >
            {pendingOrders}
          </p>
          <p className="text-[11px] text-warm-400 mt-1">pesanan pending</p>
        </div>

        {/* Today orders */}
        <div className="col-span-1 bg-white rounded-xl p-5 border border-warm-200">
          <p className="text-xs text-warm-500 uppercase tracking-wider">
            Pesanan Hari Ini
          </p>
          <p className="text-3xl font-bold text-warm-800 mt-2">{todayOrders}</p>
          <p className="text-[11px] text-warm-400 mt-1">total transaksi</p>
        </div>

        {/* Menu active */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl p-5 border border-warm-200">
          <p className="text-xs text-warm-500 uppercase tracking-wider">
            Menu Aktif
          </p>
          <p className="text-3xl font-bold text-warm-800 mt-2">{activeMenu}</p>
          <p className="text-[11px] text-warm-400 mt-1">
            dari {totalMenu} terdaftar
          </p>
        </div>
      </div>

      {/* Order Pipeline — signature element */}
      <div className="bg-white rounded-xl border border-warm-200 p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-sm font-semibold text-warm-800">
            Alur Pesanan Hari Ini
          </h3>
          <span className="text-xs text-warm-400">{totalToday} pesanan</span>
        </div>
        <Pipeline breakdown={breakdown} total={totalToday} />
      </div>

      {/* Chart + Top menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart data={salesChart} />
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-5">
          <h3 className="text-sm font-semibold text-warm-800 mb-1">
            Menu Terlaris
          </h3>
          <p className="text-xs text-warm-400 mb-4">Top 5 sepanjang waktu</p>
          {topMenu.length === 0 ? (
            <p className="text-sm text-warm-400 py-8 text-center">
              Belum ada data
            </p>
          ) : (
            <ul className="space-y-3">
              {topMenu.map((m, i) => (
                <li key={m.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-warm-400 w-4 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-warm-800 truncate">
                        {m.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 text-warm-500 shrink-0">
                        {m.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-accent shrink-0">
                      {m.count}×
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-warm-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/60"
                      style={{ width: `${(m.count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-warm-200 p-5">
        <h3 className="text-sm font-semibold text-warm-800 mb-4">
          Pesanan Terbaru
        </h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-warm-400 py-6 text-center">
            Belum ada pesanan
          </p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={o.status} />
                  <span className="text-sm text-warm-800">
                    {o.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-400 capitalize">
                    {o.status}
                  </span>
                  <span className="text-sm font-medium text-warm-700">
                    {formatRp(o.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "pending"
      ? "bg-warning"
      : status === "processing"
        ? "bg-accent"
        : "bg-success";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function Pipeline({
  breakdown,
  total,
}: {
  breakdown: { pending: number; processing: number; completed: number };
  total: number;
}) {
  const stages = [
    { key: "pending", label: "Menunggu", count: breakdown.pending, color: "warning" },
    { key: "processing", label: "Diproses", count: breakdown.processing, color: "accent" },
    { key: "completed", label: "Selesai", count: breakdown.completed, color: "success" },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    s.color === "warning"
                      ? "#D4A843"
                      : s.color === "accent"
                        ? "#C67B5C"
                        : "#5B8C5A",
                }}
              />
              <span className="text-xs text-warm-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-warm-800 mt-1">{s.count}</p>
            <p className="text-[10px] text-warm-400">
              {total > 0 ? Math.round((s.count / total) * 100) : 0}% dari hari ini
            </p>
          </div>
          {i < stages.length - 1 && (
            <div className="h-px w-6 bg-warm-200 self-center mt-2" />
          )}
        </div>
      ))}
    </div>
  );
}