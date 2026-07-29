"use client";

import { useState } from "react";

type SalesPoint = { date: string; orders: number; revenue: number };

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="bg-white rounded-xl border border-warm-200 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-warm-800">
            Penjualan 7 Hari
          </h3>
          <p className="text-xs text-warm-400">Pendapatan harian</p>
        </div>
        <span className="text-xs text-warm-400">
          Total {formatRp(data.reduce((s, d) => s + d.revenue, 0))}
        </span>
      </div>

      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const pct = (d.revenue / max) * 100;
          const dayIdx = new Date(d.date).getDay();
          const isToday = i === data.length - 1;
          return (
            <div
              key={d.date}
              className="relative flex-1 flex flex-col items-center justify-end h-full group"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md bg-warm-800 px-2 py-1 text-[10px] text-cream shadow">
                  {formatRp(d.revenue)} · {d.orders} order
                </div>
              )}
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isToday ? "bg-accent" : "bg-warm-300"
                } ${hover === i ? "opacity-90" : ""}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <span className="mt-1.5 text-[10px] text-warm-400">
                {DAYS[dayIdx]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}