import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  mobile: text('mobile').default('').notNull(),
  address: text('address').default('').notNull(),
  passwordHash: text('password_hash'),
  role: text('role').default('customer').notNull(), // 'customer' | 'admin'
  isBlocked: boolean('is_blocked').default(false).notNull(),
  emailVerified: boolean('email_verified').default(true).notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  referralCode: text('referral_code').unique(),
  referredBy: text('referred_by'),
  rewardPoints: integer('reward_points').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAddresses = pgTable('user_addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label').notNull(),
  line1: text('line1').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  pinCode: text('pin_code').notNull(),
  phone: text('phone').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serviceAreas = pgTable('service_areas', {
  id: serial('id').primaryKey(),
  pinCode: text('pin_code').notNull().unique(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  zone: text('zone').notNull(),
  fiberReady: boolean('fiber_ready').default(true).notNull(),
  maxSpeedMbps: integer('max_speed_mbps').default(1000).notNull(),
  estimatedInstallHours: integer('estimated_install_hours').default(24).notNull(),
});

export const internetPlans = pgTable('internet_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tagline: text('tagline').notNull(),
  speedMbps: integer('speed_mbps').notNull(),
  monthlyPrice: numeric('monthly_price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }).notNull(),
  dataLimit: text('data_limit').notNull(),
  validityDays: integer('validity_days').default(30).notNull(),
  connectionType: text('connection_type').default('Home').notNull(), // 'Home' | 'Business'
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').default('').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => productCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name').notNull(),
  brand: text('brand').notNull(),
  modelNumber: text('model_number').notNull(),
  description: text('description').notNull(),
  specs: jsonb('specs').$type<Record<string, string>>().default({}).notNull(),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }).notNull(),
  discountPercent: integer('discount_percent').default(0).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  warranty: text('warranty').default('1 Year Manufacturer Warranty').notNull(),
  images: jsonb('images').$type<string[]>().default([]).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  mobile: text('mobile').notNull(),
  altMobile: text('alt_mobile').default('').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  pinCode: text('pin_code').notNull(),
  connectionType: text('connection_type').default('Home').notNull(),
  planId: integer('plan_id').references(() => internetPlans.id, { onDelete: 'set null' }),
  planName: text('plan_name').notNull(),
  preferredDate: text('preferred_date').notNull(),
  notes: text('notes').default('').notNull(),
  status: text('status').default('Pending').notNull(),
  adminNotes: text('admin_notes').default('').notNull(),
  cancellationRequested: boolean('cancellation_requested').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const technicians = pgTable('technicians', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  specialty: text('specialty').notNull(),
  zone: text('zone').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const installationRequests = pgTable('installation_requests', {
  id: serial('id').primaryKey(),
  requestCode: text('request_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  serviceAddress: text('service_address').notNull(),
  requestType: text('request_type').notNull(),
  preferredDate: text('preferred_date').notNull(),
  timeSlot: text('time_slot').notNull(),
  description: text('description').notNull(),
  attachmentUrl: text('attachment_url').default('').notNull(),
  technicianId: integer('technician_id').references(() => technicians.id, { onDelete: 'set null' }),
  technicianName: text('technician_name').default('').notNull(),
  status: text('status').default('Pending').notNull(),
  internalNotes: text('internal_notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').default('percent').notNull(), // 'percent' | 'flat'
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderCode: text('order_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  couponCode: text('coupon_code').default('').notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').default('Pending').notNull(),
  orderStatus: text('order_status').default('Pending').notNull(),
  trackingNumber: text('tracking_number').default('').notNull(),
  cancellationRequested: boolean('cancellation_requested').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  modelNumber: text('model_number').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  gateway: text('gateway').notNull(),
  gatewayOrderId: text('gateway_order_id').notNull(),
  gatewayPaymentId: text('gateway_payment_id').default('').notNull(),
  gatewaySignature: text('gateway_signature').default('').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  method: text('method').notNull(),
  status: text('status').default('Created').notNull(), // 'Created' | 'Verified' | 'Failed' | 'Refunded'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  gstNumber: text('gst_number').default('29AAACS8842K1Z5').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketCode: text('ticket_code').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  subject: text('subject').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  priority: text('priority').default('Medium').notNull(),
  status: text('status').default('Open').notNull(),
  adminReply: text('admin_reply').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiInteractionLogs = pgTable('ai_interaction_logs', {
  id: serial('id').primaryKey(),
  adminUserId: integer('admin_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id'),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: text('details').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payments: many(payments),
  invoice: one(invoices, {
    fields: [orders.id],
    references: [invoices.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));
