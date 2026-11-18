export type PageRoute =
  | 'home'
  | 'plans'
  | 'prebook'
  | 'installation'
  | 'shop'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'dashboard'
  | 'admin'
  | 'about'
  | 'contact';

export interface User {
  id: number;
  uid: string;
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  role: 'customer' | 'admin' | string;
  isBlocked: boolean;
  emailVerified: boolean;
  mustChangePassword: boolean;
  referralCode?: string | null;
  rewardPoints: number;
  createdAt: string;
}

export interface InternetPlan {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  speedMbps: number;
  monthlyPrice: string;
  originalPrice: string;
  dataLimit: string;
  validityDays: number;
  connectionType: 'Home' | 'Business' | string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  categoryId: number | null;
  categoryName: string;
  brand: string;
  modelNumber: string;
  description: string;
  specs: Record<string, string>;
  sellingPrice: string;
  originalPrice: string;
  discountPercent: number;
  stockQuantity: number;
  warranty: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Booking {
  id: number;
  bookingCode: string;
  userId: number | null;
  fullName: string;
  email: string;
  mobile: string;
  altMobile: string;
  address: string;
  city: string;
  district: string;
  pinCode: string;
  connectionType: string;
  planId: number | null;
  planName: string;
  preferredDate: string;
  notes: string;
  status: string;
  adminNotes: string;
  cancellationRequested: boolean;
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  specialty: string;
  zone: string;
  isActive: boolean;
}

export interface InstallationRequest {
  id: number;
  requestCode: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceAddress: string;
  requestType: string;
  preferredDate: string;
  timeSlot: string;
  description: string;
  attachmentUrl: string;
  technicianId: number | null;
  technicianName: string;
  status: string;
  internalNotes: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  modelNumber: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface PaymentRecord {
  id: number;
  orderId: number;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: number;
  invoiceNumber: string;
  orderId: number;
  gstNumber: string;
  subtotal: string;
  taxAmount: string;
  shippingFee: string;
  discountAmount: string;
  totalAmount: string;
  issuedAt: string;
}

export interface Order {
  id: number;
  orderCode: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  subtotal: string;
  discountAmount: string;
  couponCode: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber: string;
  cancellationRequested: boolean;
  createdAt: string;
  items?: OrderItem[];
  payment?: PaymentRecord | null;
  invoice?: InvoiceRecord | null;
}

export interface UserAddress {
  id: number;
  label: string;
  line1: string;
  city: string;
  district: string;
  pinCode: string;
  phone: string;
  isDefault: boolean;
}

export interface SupportTicket {
  id: number;
  ticketCode: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  adminReply: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
