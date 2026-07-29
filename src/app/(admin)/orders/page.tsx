"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  id: number;
  menuId: number;
  quantity: number;
  price: number;
  menu: { name: string };
}

interface Order {
  id: number;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-warning/10 text-warning", border: "border-l-warning" },
  {
    value: "processing",
    label: "Diproses",
    color: "bg-accent/10 text-accent",
    border: "border-l-accent",
  },
  {
    value: "completed",
    label: "Selesai",
    color: "bg-success/10 text-success",
    border: "border-l-success",
  },
];

function statusDot(status: string) {
  return status === "pending"
    ? "bg-warning"
    : status === "processing"
      ? "bg-accent"
      : "bg-success";
}

function statusStyle(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status)?.color ??
    "bg-warm-100 text-warm-500"
  );
}

function statusBorder(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status)?.border ?? "border-l-warm-200"
  );
}

function statusLabel(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status
  );
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  async function deleteOrder(id: number) {
    if (!confirm("Hapus pesanan ini?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    fetchOrders();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-400">Memuat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-warm-400 tracking-wide">
          {orders.length} pesanan
        </p>
        <h2 className="text-2xl font-bold text-warm-800 mt-0.5">
          Daftar Pesanan
        </h2>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-warm-200 p-8 text-center text-warm-400">
            Belum ada pesanan.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl border border-warm-200 border-l-4 ${statusBorder(order.status)} p-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-2 w-2 rounded-full ${statusDot(order.status)}`}
                    />
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-semibold text-warm-800 hover:text-accent transition-colors"
                    >
                      #{order.id} — {order.customerName}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${statusStyle(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-xs text-warm-400 mb-2">
                    {formatDate(order.createdAt)}
                  </p>

                  <div className="text-sm text-warm-600">
                    {order.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="mr-2">
                        {item.quantity}x {item.menu.name}
                        {order.items.indexOf(item) <
                          Math.min(order.items.length, 3) - 1
                          ? ","
                          : ""}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-warm-400">
                        +{order.items.length - 3} item
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-warm-800 mb-2">
                    {formatRupiah(order.total)}
                  </p>
                  <div className="flex items-center gap-1">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value)
                      }
                      className="text-xs border border-warm-200 rounded-lg px-2 py-1 text-warm-600 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-xs px-2 py-1 text-danger/70 hover:text-danger hover:bg-danger/10 rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
