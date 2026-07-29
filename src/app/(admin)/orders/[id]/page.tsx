import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Diproses",
  completed: "Selesai",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const orderId = Number(id);
  if (Number.isNaN(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { menu: true },
      },
    },
  });

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/orders"
        className="text-sm text-accent hover:underline mb-4 inline-block"
      >
        &larr; Kembali ke daftar pesanan
      </Link>

      <h2 className="text-2xl font-bold text-warm-800 mb-6">
        Pesanan #{order.id}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white rounded-xl border border-warm-200 p-5">
          <h3 className="font-semibold text-warm-700 mb-3">Info Pesanan</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-warm-500">Pelanggan</dt>
              <dd className="font-medium text-warm-800">
                {order.customerName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-500">Status</dt>
              <dd className="font-medium">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    order.status === "pending"
                      ? "bg-warning/10 text-warning"
                      : order.status === "processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-success/10 text-success"
                  }`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-500">Tanggal</dt>
              <dd className="text-warm-700">
                {new Date(order.createdAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
            <div className="flex justify-between border-t border-warm-100 pt-2 mt-2">
              <dt className="text-warm-500">Total</dt>
              <dd className="font-bold text-warm-800">
                {formatRupiah(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-warm-200 p-5">
          <h3 className="font-semibold text-warm-700 mb-3">Item Pesanan</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 text-warm-500">
                <th className="text-left py-2 font-medium">Item</th>
                <th className="text-center py-2 font-medium">Qty</th>
                <th className="text-right py-2 font-medium">Harga</th>
                <th className="text-right py-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-warm-50">
                  <td className="py-2 text-warm-800 font-medium">
                    {item.menu.name}
                  </td>
                  <td className="py-2 text-center text-warm-600">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-warm-600">
                    {formatRupiah(item.price)}
                  </td>
                  <td className="py-2 text-right font-medium text-warm-700">
                    {formatRupiah(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
