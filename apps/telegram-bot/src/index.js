/**
 * KananOS Telegram Admin Bot
 *
 * Provides admin access without exposing a web admin panel.
 * Commands:
 *   /start        — Register & verify admin identity
 *   /stats        — Dashboard overview (products, orders, verifications)
 *   /orders       — List recent pending orders
 *   /verifications— List pending age verification requests
 *   /approve <id> — Approve an age verification
 *   /reject <id>  — Reject an age verification
 *   /products     — List products with stock levels
 *   /lowstock     — Products with stock ≤ 10
 *   /help         — Show available commands
 *
 * Environment variables:
 *   TELEGRAM_BOT_TOKEN   — Bot token from @BotFather
 *   DATABASE_URL         — PostgreSQL connection string
 *   ADMIN_TELEGRAM_IDS   — Comma-separated Telegram user IDs allowed to use the bot
 *   TENANT_SLUG          — Tenant slug (default: "united")
 *
 * Usage:
 *   node src/index.js
 *
 * Or with pnpm:
 *   pnpm --filter @kananos/telegram-bot start
 */

import https from "https";
import { readFileSync } from "fs";

// ── Config ───────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const TENANT_SLUG = process.env.TENANT_SLUG || "united";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is required. Get one from @BotFather.");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

// ── Telegram API helpers (raw fetch, no dependencies) ─────────────
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method, payload = {}) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram API error (${method}):`, data.description);
  }
  return data;
}

async function sendMessage(chatId, text, keyboard) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (keyboard) {
    payload.reply_markup = JSON.stringify(keyboard);
  }
  return tg("sendMessage", payload);
}

// ── Database helpers (raw SQL via postgres lib) ──────────────────
// We use the 'pg' module pattern with raw queries to avoid heavy deps.
// Dynamically import postgres
let sql;
async function getDb() {
  if (sql) return sql;
  const { default: postgres } = await import("postgres");
  sql = postgres(DATABASE_URL, { prepare: false });
  return sql;
}

async function getTenantId(slug) {
  const db = await getDb();
  const rows = await db`SELECT id FROM tenants WHERE slug = ${slug} LIMIT 1`;
  return rows[0]?.id ?? null;
}

// ── Auth check ───────────────────────────────────────────────────
function isAuthorized(userId) {
  const id = String(userId);
  return ADMIN_IDS.includes(id);
}

// ── Command handlers ─────────────────────────────────────────────

async function cmdStart(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const name = msg.from.first_name || "there";

  if (!isAuthorized(userId)) {
    await sendMessage(
      chatId,
      `🚫 *Access Denied*\n\nYour Telegram ID is \`${userId}\`.\n\nAsk the system administrator to add your ID to \`ADMIN_TELEGRAM_IDS\`.`
    );
    return;
  }

  await sendMessage(
    chatId,
    `*KananOS Admin Bot*\n\nWelcome, ${name}!\n\nYour Telegram ID \`${userId}\` is authorized.\n\nUse /help to see available commands.`
  );
}

async function cmdHelp(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  await sendMessage(
    chatId,
    `*KananOS Admin Commands*\n\n` +
      `/stats — Dashboard overview\n` +
      `/orders — Recent pending orders\n` +
      `/verifications — Pending age verifications\n` +
      `/approve <id> — Approve verification\n` +
      `/reject <id> — Reject verification\n` +
      `/products — List all products\n` +
      `/lowstock — Products with low stock (≤10)\n` +
      `/help — Show this message`
  );
}

async function cmdStats(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const tenantId = await getTenantId(TENANT_SLUG);
  if (!tenantId) {
    await sendMessage(chatId, "❌ Tenant not found.");
    return;
  }

  const db = await getDb();

  const [productCount] = await db`
    SELECT count(*)::int as count FROM products WHERE tenant_id = ${tenantId} AND is_active = true
  `;
  const [pendingOrders] = await db`
    SELECT count(*)::int as count FROM orders WHERE tenant_id = ${tenantId} AND status = 'pending_payment'
  `;
  const [pendingVerifs] = await db`
    SELECT count(*)::int as count FROM age_verifications WHERE verification_status = 'pending'
  `;
  const [lowStock] = await db`
    SELECT count(*)::int as count FROM products WHERE tenant_id = ${tenantId} AND stock_level <= 10 AND is_active = true
  `;
  const [totalOrders] = await db`
    SELECT count(*)::int as count FROM orders WHERE tenant_id = ${tenantId}
  `;

  await sendMessage(
    chatId,
    `*📊 Dashboard Overview*\n\n` +
      `🏷 Products: *${productCount.count}*\n` +
      `📦 Total Orders: *${totalOrders.count}*\n` +
      `⏳ Pending Orders: *${pendingOrders.count}*\n` +
      `🔍 Pending Verifications: *${pendingVerifs.count}*\n` +
      `⚠️ Low Stock Items: *${lowStock.count}*`
  );
}

async function cmdOrders(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const tenantId = await getTenantId(TENANT_SLUG);
  if (!tenantId) {
    await sendMessage(chatId, "❌ Tenant not found.");
    return;
  }

  const db = await getDb();
  const orders = await db`
    SELECT id, total_amount, status, created_at, customer_name
    FROM orders
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  if (orders.length === 0) {
    await sendMessage(chatId, "📦 No orders yet.");
    return;
  }

  let text = "*📦 Recent Orders*\n\n";
  for (const o of orders) {
    const date = new Date(o.created_at).toLocaleDateString("en-US");
    const status = o.status.replace(/_/g, " ");
    text += `*#${o.id}* — $${parseFloat(o.total_amount).toFixed(2)}\n`;
    text += `   ${o.customer_name || "Unknown"} · ${status} · ${date}\n\n`;
  }

  await sendMessage(chatId, text);
}

async function cmdVerifications(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const db = await getDb();
  const verifs = await db`
    SELECT id, user_id, date_of_birth, verification_status, created_at
    FROM age_verifications
    WHERE verification_status = 'pending'
    ORDER BY created_at ASC
    LIMIT 10
  `;

  if (verifs.length === 0) {
    await sendMessage(chatId, "✅ No pending verifications.");
    return;
  }

  let text = "*🔍 Pending Age Verifications*\n\n";
  for (const v of verifs) {
    const date = new Date(v.created_at).toLocaleDateString("en-US");
    const dob = v.date_of_birth ? new Date(v.date_of_birth).toLocaleDateString("en-US") : "N/A";
    text += `*ID #${v.id}* — User ${v.user_id}\n`;
    text += `   DOB: ${dob} · Submitted: ${date}\n`;
    text += `   /approve_${v.id}  or  /reject_${v.id}\n\n`;
  }

  await sendMessage(chatId, text);
}

async function handleVerifAction(msg, action, id) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const verifId = parseInt(id, 10);
  if (isNaN(verifId)) {
    await sendMessage(chatId, "❌ Invalid ID. Usage: /approve <id>");
    return;
  }

  const db = await getDb();
  const status = action === "approve" ? "approved" : "rejected";
  const result = await db`
    UPDATE age_verifications
    SET verification_status = ${status}, updated_at = now()
    WHERE id = ${verifId} AND verification_status = 'pending'
    RETURNING id
  `;

  if (result.length === 0) {
    await sendMessage(chatId, `❌ Verification #${verifId} not found or already processed.`);
  } else {
    const emoji = action === "approve" ? "✅" : "❌";
    await sendMessage(chatId, `${emoji} Verification #${verifId} ${status}.`);
  }
}

async function cmdProducts(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const tenantId = await getTenantId(TENANT_SLUG);
  if (!tenantId) {
    await sendMessage(chatId, "❌ Tenant not found.");
    return;
  }

  const db = await getDb();
  const products = await db`
    SELECT sku, name, base_price, stock_level, is_active
    FROM products
    WHERE tenant_id = ${tenantId}
    ORDER BY name ASC
    LIMIT 20
  `;

  if (products.length === 0) {
    await sendMessage(chatId, "📦 No products found.");
    return;
  }

  let text = "*🏷 Products*\n\n";
  for (const p of products) {
    const stock = p.stock_level <= 10 ? "⚠️" : "✅";
    const active = p.is_active ? "" : " (hidden)";
    text += `${stock} *${p.name}*\n`;
    text += `   ${p.sku || "no SKU"} · $${parseFloat(p.base_price).toFixed(2)} · ${p.stock_level} units${active}\n\n`;
  }

  await sendMessage(chatId, text);
}

async function cmdLowStock(msg) {
  const chatId = msg.chat.id;
  if (!isAuthorized(msg.from.id)) return;

  const tenantId = await getTenantId(TENANT_SLUG);
  if (!tenantId) return;

  const db = await getDb();
  const products = await db`
    SELECT sku, name, stock_level
    FROM products
    WHERE tenant_id = ${tenantId} AND stock_level <= 10 AND is_active = true
    ORDER BY stock_level ASC
  `;

  if (products.length === 0) {
    await sendMessage(chatId, "✅ All products well stocked.");
    return;
  }

  let text = "*⚠️ Low Stock Alert*\n\n";
  for (const p of products) {
    text += `*${p.name}*\n   ${p.sku || ""} — ${p.stock_level} units left\n\n`;
  }

  await sendMessage(chatId, text);
}

// ── Message router ───────────────────────────────────────────────
async function handleMessage(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const text = msg.text.trim();
  const chatId = msg.chat.id;

  try {
    if (text === "/start" || text === "/start@" + (msg.text.split("@")[1] || "")) {
      await cmdStart(msg);
    } else if (text === "/help") {
      await cmdHelp(msg);
    } else if (text === "/stats") {
      await cmdStats(msg);
    } else if (text === "/orders") {
      await cmdOrders(msg);
    } else if (text === "/verifications") {
      await cmdVerifications(msg);
    } else if (text === "/products") {
      await cmdProducts(msg);
    } else if (text === "/lowstock") {
      await cmdLowStock(msg);
    } else if (text.startsWith("/approve_")) {
      const id = text.replace("/approve_", "");
      await handleVerifAction(msg, "approve", id);
    } else if (text.startsWith("/reject_")) {
      const id = text.replace("/reject_", "");
      await handleVerifAction(msg, "reject", id);
    } else if (text.startsWith("/approve ")) {
      const id = text.split(" ")[1];
      await handleVerifAction(msg, "approve", id);
    } else if (text.startsWith("/reject ")) {
      const id = text.split(" ")[1];
      await handleVerifAction(msg, "reject", id);
    }
  } catch (err) {
    console.error("Error handling message:", err);
    await sendMessage(chatId, "❌ An error occurred. Check server logs.");
  }
}

// ── Long-polling loop ───────────────────────────────────────────
let offset = 0;
console.log(`KananOS Telegram bot starting...`);
console.log(`Authorized admin IDs: ${ADMIN_IDS.join(", ") || "(none set)"}`);
console.log(`Tenant slug: ${TENANT_SLUG}`);

async function poll() {
  try {
    const res = await fetch(
      `${TG_API}/getUpdates?offset=${offset}&timeout=30`,
      { method: "GET" }
    );
    const data = await res.json();

    if (data.ok && data.result) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleMessage(update);
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }
  setTimeout(poll, 1000);
}

poll();
