import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const menus = await prisma.menu.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(menus);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, category, price } = body;

  if (!name || !category || price === undefined || price === null) {
    return NextResponse.json(
      { error: "Name, category, and price are required" },
      { status: 400 }
    );
  }

  const priceNum = Number(price);
  if (!Number.isInteger(priceNum) || priceNum < 0) {
    return NextResponse.json(
      { error: "Price must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const menu = await prisma.menu.create({
      data: {
        name: String(name).trim(),
        category: String(category).trim(),
        price: priceNum,
      },
    });
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
