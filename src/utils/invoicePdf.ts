import { jsPDF } from 'jspdf';
import { InvoiceRecord, Order, OrderItem, PaymentRecord } from '../types.ts';

export function formatINR(value: string | number): string {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function downloadInvoicePdf(data: {
  order: Order;
  items: OrderItem[];
  payment: PaymentRecord | null;
  invoice: InvoiceRecord | null;
}) {
  const { order, items, payment, invoice } = data;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(11, 22, 44);
  doc.rect(0, 0, pageWidth, 84, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('STAR FIBERNET', 40, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Connecting You to a Faster Tomorrow · GSTIN: 29AAACS8842K1Z5', 40, 56);
  doc.text('Star Fibernet Towers, MG Road, Bengaluru 560001 · support@starfibernet.com', 40, 70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TAX INVOICE', pageWidth - 40, 42, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    invoice?.invoiceNumber || `INV-SF-${order.orderCode.replace('ORD-', '')}`,
    pageWidth - 40,
    58,
    { align: 'right' }
  );

  // Meta grid
  let y = 112;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed & Shipped To:', 40, y);
  doc.text('Order & Payment Summary:', 330, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  y += 16;
  doc.text(order.customerName, 40, y);
  doc.text(`Order ID: ${order.orderCode}`, 330, y);
  y += 14;
  doc.text(`Phone: ${order.customerPhone}`, 40, y);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 330, y);
  y += 14;
  const addressLines = doc.splitTextToSize(order.shippingAddress, 250);
  doc.text(addressLines, 40, y);
  doc.text(`Payment Method: ${order.paymentMethod} (${order.paymentStatus})`, 330, y);
  doc.text(
    `Transaction Ref: ${payment?.gatewayPaymentId || payment?.gatewayOrderId || 'COD'}`,
    330,
    y + 14
  );

  y += Math.max(addressLines.length * 13, 28) + 22;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, pageWidth - 80, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('ITEM & MODEL', 48, y + 15);
  doc.text('QTY', 340, y + 15, { align: 'right' });
  doc.text('UNIT PRICE', 440, y + 15, { align: 'right' });
  doc.text('AMOUNT', pageWidth - 48, y + 15, { align: 'right' });

  y += 38;
  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    const label = `${item.productName} (${item.modelNumber})`;
    const wrapped = doc.splitTextToSize(label, 250);
    doc.text(wrapped, 48, y);
    doc.text(String(item.quantity), 340, y, { align: 'right' });
    doc.text(`INR ${Number(item.unitPrice).toFixed(2)}`, 440, y, { align: 'right' });
    doc.text(`INR ${Number(item.lineTotal).toFixed(2)}`, pageWidth - 48, y, {
      align: 'right',
    });
    y += wrapped.length * 13 + 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(40, y - 4, pageWidth - 40, y - 4);
  }

  y += 14;
  const totalsXLabel = 370;
  const totalsXVal = pageWidth - 48;
  doc.setFontSize(9.5);

  const addTotalLine = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, totalsXLabel, y);
    doc.text(val, totalsXVal, y, { align: 'right' });
    y += 16;
  };

  addTotalLine('Subtotal', `INR ${Number(order.subtotal).toFixed(2)}`);
  if (Number(order.discountAmount) > 0) {
    addTotalLine(`Discount (${order.couponCode || 'PROMO'})`, `- INR ${Number(order.discountAmount).toFixed(2)}`);
  }
  addTotalLine('GST (18%)', `INR ${Number(order.taxAmount).toFixed(2)}`);
  addTotalLine('Shipping Charges', `INR ${Number(order.shippingFee).toFixed(2)}`);
  doc.setDrawColor(15, 23, 42);
  doc.line(totalsXLabel, y - 6, pageWidth - 40, y - 6);
  y += 6;
  doc.setFontSize(11);
  addTotalLine('Grand Total', `INR ${Number(order.totalAmount).toFixed(2)}`, true);

  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This is a computer-generated GST tax invoice issued by Star Fibernet Broadband & Hardware Services.',
    40,
    y
  );

  doc.save(`${invoice?.invoiceNumber || order.orderCode}.pdf`);
}
