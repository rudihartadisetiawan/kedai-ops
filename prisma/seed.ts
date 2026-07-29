import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const menus = [
  { category: "Coffee", items: [
    { name: "Kopi Hitam", price: 15000 },
    { name: "Es Kopi Susu", price: 18000 },
    { name: "Americano", price: 20000 },
    { name: "Cappuccino", price: 25000 },
    { name: "Latte", price: 25000 },
    { name: "Mocha", price: 28000 },
    { name: "Piccolo", price: 22000 },
    { name: "Affogato", price: 30000 },
  ]},
  { category: "Non-Coffee", items: [
    { name: "Matcha Latte", price: 25000 },
    { name: "Coklat Panas", price: 18000 },
    { name: "Es Coklat", price: 20000 },
    { name: "Lemon Tea", price: 12000 },
    { name: "Lychee Tea", price: 15000 },
    { name: "Red Velvet", price: 28000 },
    { name: "Thai Tea", price: 18000 },
    { name: "Ginger Honey", price: 15000 },
  ]},
  { category: "Pastry", items: [
    { name: "Croissant Butter", price: 18000 },
    { name: "Banana Cake", price: 15000 },
    { name: "Cinnamon Roll", price: 20000 },
    { name: "Brownies Panggang", price: 18000 },
    { name: "Cookies Coklat", price: 12000 },
    { name: "Muffin Blueberry", price: 15000 },
  ]},
  { category: "Snack", items: [
    { name: "Kentang Goreng", price: 15000 },
    { name: "Tahu Crispy", price: 12000 },
    { name: "Pisang Goreng Keju", price: 15000 },
    { name: "Lumpia Sayur", price: 10000 },
    { name: "Roti Bakar Coklat", price: 15000 },
    { name: "Chicken Wings", price: 22000 },
  ]},
];

const customers = [
  "Budi", "Siti", "Andi", "Rina", "Dedi", "Ayu", "Rudi", "Maya",
  "Hendra", "Fitri", "Dimas", "Wulan", "Agus", "Lina", "Bayu",
  "Citra", "Eko", "Nita", "Fajar", "Putri", "Rizky", "Dewi",
  "Tono", "Sari", "Irfan",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function hourToDate(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedOrders(menuIds: number[]) {
  const existing = await prisma.order.count();
  if (existing > 0) {
    console.log(`  ... ${existing} pesanan sudah ada, skip seed orders.`);
    return;
  }

  // ponytail: realistic cafe order patterns — peak at morning coffee (8-10) and afternoon (14-16)
  const dayConfigs = [
    { daysAgo: 7, count: 8, statusWeights: { pending: 0, processing: 0, completed: 10 } },
    { daysAgo: 6, count: 12, statusWeights: { pending: 0, processing: 0, completed: 10 } },
    { daysAgo: 5, count: 6, statusWeights: { pending: 0, processing: 0, completed: 10 } },
    { daysAgo: 4, count: 14, statusWeights: { pending: 0, processing: 0, completed: 10 } },
    { daysAgo: 3, count: 10, statusWeights: { pending: 0, processing: 0, completed: 10 } },
    { daysAgo: 2, count: 9, statusWeights: { pending: 0, processing: 1, completed: 9 } },
    { daysAgo: 1, count: 15, statusWeights: { pending: 2, processing: 2, completed: 6 } },
    { daysAgo: 0, count: 11, statusWeights: { pending: 3, processing: 3, completed: 4 } },
  ];

  let totalCreated = 0;

  for (const cfg of dayConfigs) {
    for (let i = 0; i < cfg.count; i++) {
      // Pick random hour with bias toward cafe peak hours
      const peakRoll = Math.random();
      let hour: number;
      if (peakRoll < 0.35) hour = rand(7, 10);   // morning coffee rush
      else if (peakRoll < 0.55) hour = rand(11, 13); // lunch
      else if (peakRoll < 0.85) hour = rand(14, 17); // afternoon
      else hour = rand(18, 21);                    // evening

      const createdAt = hourToDate(cfg.daysAgo, hour, rand(0, 59));

      // Weighted status pick
      const statusRoll = rand(1, 10);
      const w = cfg.statusWeights;
      let status: string;
      if (statusRoll <= w.completed) status = "completed";
      else if (statusRoll <= w.completed + w.processing) status = "processing";
      else status = "pending";

      // Pick 1-4 random menu items
      const itemCount = rand(1, 4);
      const pickedMenus = pickN(menuIds, itemCount);

      let total = 0;
      const items = pickedMenus.map((mid) => {
        const menu = allMenusFlat.find((m) => m.id === mid)!;
        const qty = rand(1, 3);
        total += menu.price * qty;
        return { menuId: mid, quantity: qty, price: menu.price };
      });

      const order = await prisma.order.create({
        data: {
          customerName: pick(customers),
          status,
          total,
          createdAt,
          updatedAt: createdAt,
          items: { create: items },
        },
      });

      totalCreated++;
    }
  }

  console.log(`  ... ${totalCreated} pesanan dummy dibuat (7 hari).`);
}

let allMenusFlat: { id: number; name: string; price: number; category: string }[] = [];

async function main() {
  // Seed menu
  for (const group of menus) {
    for (const item of group.items) {
      await prisma.menu.upsert({
        where: { name: item.name },
        update: { price: item.price, category: group.category },
        create: { name: item.name, category: group.category, price: item.price },
      });
    }
  }
  const menuRecords = await prisma.menu.findMany({
    select: { id: true, name: true, price: true, category: true },
  });
  allMenusFlat = menuRecords;
  console.log(`Seeded ${menuRecords.length} menu items.`);

  // Seed admin
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
    },
  });
  console.log("Seeded admin user (admin / admin123).");

  // Seed orders
  const menuIds = menuRecords.map((m) => m.id);
  await seedOrders(menuIds);
}

main()
  .then(async () => {
    console.log("Seed selesai.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
