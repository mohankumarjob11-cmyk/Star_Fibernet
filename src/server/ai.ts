import { GoogleGenAI } from '@google/genai';
import { desc, lt } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  aiInteractionLogs,
  bookings,
  installationRequests,
  orderItems,
  orders,
  products,
  supportTickets,
} from '../db/schema.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function buildBusinessSnapshot() {
  const [allOrders, allItems, allProducts, allBookings, allInstalls, allTickets] =
    await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50),
      db.select().from(orderItems),
      db.select().from(products),
      db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(40),
      db.select().from(installationRequests).orderBy(desc(installationRequests.createdAt)).limit(40),
      db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(30),
    ]);

  const lowStock = await db
    .select()
    .from(products)
    .where(lt(products.stockQuantity, 12));

  const paidRevenue = allOrders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const pendingOrders = allOrders.filter(
    (o) => !['Delivered', 'Cancelled', 'Refunded'].includes(o.orderStatus)
  );

  const productRevenue = new Map<string, { qty: number; revenue: number }>();
  for (const item of allItems) {
    const prev = productRevenue.get(item.productName) || { qty: 0, revenue: 0 };
    productRevenue.set(item.productName, {
      qty: prev.qty + item.quantity,
      revenue: prev.revenue + Number(item.lineTotal),
    });
  }

  const topProducts = Array.from(productRevenue.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, stats]) => ({ name, ...stats }));

  const slowMoving = allProducts
    .filter((p) => !productRevenue.has(p.name) && p.stockQuantity > 25)
    .slice(0, 6)
    .map((p) => ({ name: p.name, stock: p.stockQuantity, price: p.sellingPrice }));

  return {
    summary: {
      totalOrders: allOrders.length,
      paidRevenueINR: Math.round(paidRevenue * 100) / 100,
      pendingOrdersCount: pendingOrders.length,
      totalProducts: allProducts.length,
      lowStockCount: lowStock.length,
      pendingBookingsCount: allBookings.filter((b) => b.status === 'Pending').length,
      totalBookingsCount: allBookings.length,
      pendingInstallationsCount: allInstalls.filter((i) => i.status === 'Pending').length,
      openTicketsCount: allTickets.filter((t) => t.status === 'Open').length,
    },
    recentOrders: allOrders.slice(0, 10).map((o) => ({
      orderCode: o.orderCode,
      totalAmount: o.totalAmount,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
    })),
    lowStockProducts: lowStock.map((p) => ({
      name: p.name,
      model: p.modelNumber,
      stock: p.stockQuantity,
      price: p.sellingPrice,
    })),
    topProducts,
    slowMovingProducts: slowMoving,
    pendingInstallations: allInstalls
      .filter((i) => i.status === 'Pending' || i.status === 'Scheduled')
      .map((i) => ({
        requestCode: i.requestCode,
        type: i.requestType,
        preferredDate: i.preferredDate,
        status: i.status,
      })),
    openTickets: allTickets
      .filter((t) => t.status !== 'Closed')
      .map((t) => ({
        ticketCode: t.ticketCode,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
      })),
  };
}

export async function askAdminAiAssistant(
  adminUserId: number,
  prompt: string
): Promise<string> {
  const ai = getGeminiClient();
  const snapshot = await buildBusinessSnapshot();

  const systemInstruction = `You are the Star Fibernet Executive Admin AI Assistant.
You serve strictly authenticated Star Fibernet administrators for business intelligence, inventory planning, support reply drafting, and operational reports.
Rules:
1. Base all numbers, stock alerts, orders, and ticket summaries strictly on the live PostgreSQL business snapshot provided below. Never invent metrics.
2. Format currency in INR (₹) cleanly with commas.
3. Keep responses concise, structured with clear headings/bullet lists, and actionable.
4. You operate strictly in advisory mode: never claim to have executed payments, deleted records, or modified orders without admin confirmation.
5. Never expose customer PII (passwords, private phone numbers, or sensitive addresses) unnecessarily.

LIVE BUSINESS SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
    },
  });

  const reply = response.text?.trim() || 'No summary could be generated.';

  await db.insert(aiInteractionLogs).values({
    adminUserId,
    prompt,
    response: reply,
  });

  return reply;
}
