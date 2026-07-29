import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { menu: { select: { name: true } } },
      },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { customerName, items } = body;

  if (!customerName || typeof customerName !== "string") {
    return NextResponse.json(
      { error: "Customer name is required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Items must be a non-empty array" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.menuId || Number.isNaN(Number(item.menuId)) || Number(item.menuId) <= 0) {
      return NextResponse.json(
        { error: "Each item must have a valid menuId" },
        { status: 400 }
      );
    }
    if (!item.quantity || Number.isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return NextResponse.json(
        { error: "Each item must have a positive quantity" },
        { status: 400 }
      );
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData = [];
      let total = 0;

      for (const item of items) {
        const menuId = Number(item.menuId);
        const quantity = Number(item.quantity);
        const menu = await tx.menu.findUnique({ where: { id: menuId } });
        if (!menu) {
          throw new Error(`Menu with id ${menuId} not found`);
        }
        const price = menu.price;
        total += price * quantity;
        orderItemsData.push({ menuId, quantity, price });
      }

      return tx.order.create({
        data: {
          customerName: String(customerName).trim(),
          total,
          items: { create: orderItemsData },
        },
        include: {
          items: {
            include: { menu: { select: { name: true } } },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
