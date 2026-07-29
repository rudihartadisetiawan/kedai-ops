"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

const CATEGORIES = ["Coffee", "Non-Coffee", "Pastry", "Snack"];

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    open: boolean;
    edit: MenuItem | null;
  }>({ open: false, edit: null });
  const [form, setForm] = useState({
    name: "",
    category: "Coffee",
    price: "",
  });
  const [error, setError] = useState("");

  async function fetchMenus() {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setMenus(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMenus();
  }, []);

  function openAdd() {
    setForm({ name: "", category: "Coffee", price: "" });
    setError("");
    setModal({ open: true, edit: null });
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
    });
    setError("");
    setModal({ open: true, edit: item });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const url = modal.edit
      ? `/api/menu/${modal.edit.id}`
      : "/api/menu";
    const method = modal.edit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Gagal menyimpan");
      return;
    }

    setModal({ open: false, edit: null });
    fetchMenus();
  }

  async function toggleAvailable(item: MenuItem) {
    await fetch(`/api/menu/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    fetchMenus();
  }

  async function deleteMenu(id: number) {
    if (!confirm("Hapus menu ini?")) return;
    const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
    if (res.ok) fetchMenus();
    else {
      const data = await res.json();
      alert(data.error || "Gagal menghapus");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-400">Memuat menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-warm-400 tracking-wide">
            {menus.length} menu terdaftar
          </p>
          <h2 className="text-2xl font-bold text-warm-800 mt-0.5">
            Kelola Menu
          </h2>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-warm-700 hover:bg-warm-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
        >
          + Tambah Menu
        </button>
      </div>

      <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-200 bg-warm-50 text-warm-600">
              <th className="text-left px-4 py-3 font-medium rounded-tl-xl">
                Nama
              </th>
              <th className="text-left px-4 py-3 font-medium">Kategori</th>
              <th className="text-right px-4 py-3 font-medium">Harga</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium rounded-tr-xl">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {menus.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-warm-400">
                  Belum ada menu. Tambahkan menu pertama!
                </td>
              </tr>
            ) : (
              menus.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-warm-100 hover:bg-warm-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-warm-800">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-warm-500">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 text-warm-500">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-warm-700">
                    {formatRupiah(item.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                        item.available
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {item.available ? "Tersedia" : "Habis"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="px-2 py-1 text-xs text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMenu(item.id)}
                        className="px-2 py-1 text-xs text-danger/70 hover:text-danger hover:bg-danger/10 rounded cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-warm-800 mb-4">
              {modal.edit ? "Edit Menu" : "Tambah Menu"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">
                  Nama
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-warm-800 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="Nama menu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-warm-800 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                  min={0}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg text-warm-800 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="15000"
                />
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, edit: null })}
                  className="px-4 py-2 text-sm text-warm-500 hover:text-warm-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-warm-700 hover:bg-warm-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {modal.edit ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
