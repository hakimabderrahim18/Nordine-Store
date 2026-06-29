import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.pipe(stream);

  // Colors
  const primaryColor = '#FFC93C'; // Luxury Gold
  const secondaryColor = '#111827'; // Dark Slate
  const accentColor = '#6B7280'; // Muted Grey
  const textColor = '#0F172A'; // Text Charcoal

  // Header / Branding
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('NOUNOU TELECOM', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .text('Premium Spare Parts & Accessories', 50, 75)
    .fillColor(accentColor)
    .text('123 Cyber Plaza, Tech City', 50, 90)
    .text('support@nounoutelecom.com', 50, 105);

  // Invoice Title & Info
  doc
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('INVOICE', 400, 50, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor(accentColor)
    .text(`Invoice No: #INV-${order._id.toString().substring(18).toUpperCase()}`, 400, 75, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' })
    .text(`Payment: ${order.paymentMethod} (${order.isPaid ? 'Paid' : 'Unpaid'})`, 400, 105, { align: 'right' });

  doc.moveTo(50, 130).lineTo(550, 130).stroke('#E5E7EB');

  // Customer / Shipping Info
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Bill To:', 50, 150)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(order.shippingAddress.name || (order.user && order.user.name) || 'Valued Customer', 50, 165)
    .text(`${order.shippingAddress.street}`, 50, 180)
    .text(`${order.shippingAddress.city}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode}`, 50, 195)
    .text(`${order.shippingAddress.country}`, 50, 210)
    .text(`Phone: ${order.shippingAddress.phone}`, 50, 225);

  // Shipping Status / Tracking
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Shipment Info:', 400, 150)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(`Status: ${order.deliveryStatus.toUpperCase()}`, 400, 165)
    .text(`Tracking No: ${order.trackingNumber || 'Pending shipment'}`, 400, 180);

  doc.moveTo(50, 250).lineTo(550, 250).stroke('#E5E7EB');

  // Items Table Header
  let y = 270;
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Item Description', 50, y)
    .text('Variant', 250, y)
    .text('Qty', 380, y, { width: 30, align: 'right' })
    .text('Price', 430, y, { width: 50, align: 'right' })
    .text('Total', 500, y, { width: 50, align: 'right' });

  doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#E5E7EB');
  y += 25;

  // Items Table Content
  doc.font('Helvetica').fontSize(10).fillColor(textColor);
  order.orderItems.forEach(item => {
    // Format variant string
    let variantStr = 'N/A';
    if (item.variant) {
      // Map instance
      const mapEntries = item.variant instanceof Map ? Array.from(item.variant.entries()) : Object.entries(item.variant);
      variantStr = mapEntries.map(([k, v]) => `${k}: ${v}`).join(', ');
    }

    doc
      .text(item.name, 50, y, { width: 190, height: 20, ellipsis: true })
      .text(variantStr, 250, y, { width: 120, height: 20, ellipsis: true })
      .text(item.quantity.toString(), 380, y, { width: 30, align: 'right' })
      .text(`${item.price.toLocaleString()} DA`, 430, y, { width: 50, align: 'right' })
      .text(`${(item.quantity * item.price).toLocaleString()} DA`, 500, y, { width: 50, align: 'right' });

    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke('#E5E7EB');
  y += 15;

  // Summary Math Section
  const labelX = 380;
  const valX = 500;

  doc.text('Subtotal:', labelX, y, { width: 100, align: 'right' });
  doc.text(`${order.itemsPrice.toLocaleString()} DA`, valX, y, { width: 50, align: 'right' });
  y += 15;

  if (order.discountPrice > 0) {
    doc.text('Discount:', labelX, y, { width: 100, align: 'right' });
    doc.text(`-${order.discountPrice.toLocaleString()} DA`, valX, y, { width: 50, align: 'right' });
    y += 15;
  }

  doc.text('Shipping:', labelX, y, { width: 100, align: 'right' });
  doc.text(`${order.shippingPrice.toLocaleString()} DA`, valX, y, { width: 50, align: 'right' });
  y += 15;

  doc.moveTo(380, y + 2).lineTo(550, y + 2).stroke('#E5E7EB');
  y += 8;

  doc.font('Helvetica-Bold').fillColor(textColor);
  doc.text('Total Amount:', labelX, y, { width: 100, align: 'right' });
  doc.text(`${order.totalPrice.toLocaleString()} DA`, valX, y, { width: 50, align: 'right' });

  // Thank you Footer
  doc
    .fillColor(accentColor)
    .font('Helvetica-Oblique')
    .fontSize(10)
    .text('Merci pour votre confiance avec Nounou Telecom!', 50, 700, { align: 'center' });

  doc.end();
};
