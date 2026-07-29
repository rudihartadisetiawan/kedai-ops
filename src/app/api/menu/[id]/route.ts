import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid menu ID" }, { status: 400 });
  }

  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  return NextResponse.json(menu);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid menu ID" }, { status: 400 });
  }

  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, category, price, available } = body;

  const data: Partial<{ name: string; category: string; price: number; available: boolean }> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (category !== undefined) data.category = String(category).trim();
  if (price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative integer" },
        { status: 400 }
      );
    }
    data.price = priceNum;
  }
  if (available !== undefined) data.available = Boolean(available);

  try {
    const menu = await prisma.menu.update({ where: { id }, data });
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid menu ID" }, { status: 400 });
  }

  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { menuId: id },
    take: 1,
  });
  if (orderItems.length > 0) {
    return NextResponse.json(
      { error: "Menu sedang digunakan dalam pesanan" },
      { status: 409 }
    );
  }

  await prisma.menu.delete({ where: { id } });
  return NextResponse.json({ message: "Menu deleted" });
}
