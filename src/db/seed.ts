import { count } from 'drizzle-orm';
import { db } from './index.ts';
import {
  appSettings,
  bookings,
  coupons,
  installationRequests,
  internetPlans,
  invoices,
  notifications,
  orderItems,
  orders,
  payments,
  productCategories,
  products,
  serviceAreas,
  supportTickets,
  technicians,
  users,
} from './schema.ts';
import { hashPassword } from '../server/auth.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      console.error('Database seed failed:', err);
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  // 1. Seed initial Admin & Demo Customer if users table is empty
  const [{ value: userCount }] = await db.select({ value: count() }).from(users);
  if (Number(userCount) === 0) {
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin';
    await db
      .insert(users)
      .values([
        {
          uid: 'admin-star-root',
          fullName: 'Star Fibernet Admin',
          email: 'admin@gmail.com',
          mobile: '+91 98450 00001',
          address: 'Star Fibernet NOC, MG Road, Bengaluru',
          passwordHash: hashPassword(adminPassword),
          role: 'admin',
          emailVerified: true,
          mustChangePassword: true,
          referralCode: 'STAR-ADMIN',
          rewardPoints: 0,
        },
        {
          uid: 'cust-priya-01',
          fullName: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          mobile: '+91 98450 44210',
          address: 'Flat 402, Emerald Towers, Indiranagar, Bengaluru',
          passwordHash: hashPassword('StarUser@2026'),
          role: 'customer',
          emailVerified: true,
          mustChangePassword: false,
          referralCode: 'STAR-PRIYA26',
          rewardPoints: 350,
        },
      ])
      .onConflictDoNothing();
  }

  // 2. Seed App Settings
  await db
    .insert(appSettings)
    .values([
      { key: 'cod_enabled', value: 'true' },
      { key: 'referral_bonus_points', value: '250' },
      { key: 'shipping_flat', value: '99' },
      { key: 'free_shipping_threshold', value: '2500' },
    ])
    .onConflictDoNothing();

  // 3. Seed Service Areas
  const [{ value: areaCount }] = await db
    .select({ value: count() })
    .from(serviceAreas);
  if (Number(areaCount) === 0) {
    await db
      .insert(serviceAreas)
      .values([
        { pinCode: '560001', city: 'Bengaluru', district: 'Bengaluru Urban', zone: 'Central Ring', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 12 },
        { pinCode: '560038', city: 'Bengaluru', district: 'Bengaluru Urban', zone: 'Indiranagar East', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 18 },
        { pinCode: '560100', city: 'Bengaluru', district: 'Bengaluru Urban', zone: 'Electronic City', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 24 },
        { pinCode: '500081', city: 'Hyderabad', district: 'Rangareddy', zone: 'HITEC Corridor', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 18 },
        { pinCode: '600001', city: 'Chennai', district: 'Chennai', zone: 'Metro North', fiberReady: true, maxSpeedMbps: 600, estimatedInstallHours: 24 },
        { pinCode: '400001', city: 'Mumbai', district: 'Mumbai City', zone: 'Fort & Colaba', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 16 },
        { pinCode: '110001', city: 'New Delhi', district: 'Central Delhi', zone: 'Connaught Grid', fiberReady: true, maxSpeedMbps: 1000, estimatedInstallHours: 24 },
        { pinCode: '411001', city: 'Pune', district: 'Pune', zone: 'Koregaon Fiber', fiberReady: true, maxSpeedMbps: 600, estimatedInstallHours: 24 },
      ])
      .onConflictDoNothing();
  }

  // 4. Seed Internet Plans
  const [{ value: planCount }] = await db
    .select({ value: count() })
    .from(internetPlans);
  if (Number(planCount) === 0) {
    await db
      .insert(internetPlans)
      .values([
        {
          name: 'Basic Plan',
          slug: 'basic-fiber-100',
          tagline: 'Ideal for daily browsing, HD streaming, and remote study.',
          speedMbps: 100,
          monthlyPrice: '499.00',
          originalPrice: '649.00',
          dataLimit: 'Unlimited (FUP 3.3 TB)',
          validityDays: 30,
          connectionType: 'Home',
          features: [
            '100 Mbps symmetrical upload & download',
            'Zero installation charges on 6-month billing',
            'Single-band optical ONT included on deposit',
            '24x7 NOC monitoring & support',
          ],
          isPopular: false,
          isActive: true,
        },
        {
          name: 'Standard Plan',
          slug: 'standard-fiber-300',
          tagline: 'Built for smart homes, 4K streaming, and low-ping gaming.',
          speedMbps: 300,
          monthlyPrice: '799.00',
          originalPrice: '999.00',
          dataLimit: 'Unlimited (FUP 4 TB)',
          validityDays: 30,
          connectionType: 'Home',
          features: [
            '300 Mbps symmetrical optical fiber',
            'Dual-Band Wi-Fi 6 ONT router included',
            'Sub-4ms local peering latency',
            'Priority 18-hour installation SLA',
          ],
          isPopular: true,
          isActive: true,
        },
        {
          name: 'Premium Plan',
          slug: 'premium-fiber-600',
          tagline: 'Multi-device studios, cloud backups, and creator workflows.',
          speedMbps: 600,
          monthlyPrice: '1199.00',
          originalPrice: '1499.00',
          dataLimit: 'Truly Unlimited',
          validityDays: 30,
          connectionType: 'Home',
          features: [
            '600 Mbps dedicated residential fiber',
            'Wi-Fi 7 tri-band router discount voucher',
            'Dedicated IPv6 + optional Static IPv4',
            'Same-day technician dispatch',
          ],
          isPopular: false,
          isActive: true,
        },
        {
          name: 'Business Plan',
          slug: 'business-leased-1000',
          tagline: 'Enterprise-grade 1 Gbps fiber with SLA & static IP.',
          speedMbps: 1000,
          monthlyPrice: '2499.00',
          originalPrice: '3199.00',
          dataLimit: 'Truly Unlimited Enterprise',
          validityDays: 30,
          connectionType: 'Business',
          features: [
            '1000 Mbps (1 Gbps) dedicated DIA line',
            '99.95% uptime SLA with dual-ring failover',
            '1 Static IPv4 + /56 IPv6 subnet included',
            'Dedicated enterprise account engineer',
          ],
          isPopular: false,
          isActive: true,
        },
      ])
      .onConflictDoNothing();
  }

  // 5. Seed All 14 Product Categories
  const categoryNames = [
    'Wi-Fi Routers',
    'Fiber ONT Devices',
    'ONU Devices',
    'Optical Network Equipment',
    'Fiber Optic Cables',
    'Ethernet Cables',
    'LAN Connectors',
    'Network Switches',
    'Wi-Fi Extenders',
    'Media Converters',
    'Patch Cords',
    'Networking Accessories',
    'Power Adapters',
    'Installation Accessories',
  ];

  const [{ value: catCount }] = await db
    .select({ value: count() })
    .from(productCategories);
  if (Number(catCount) === 0) {
    await db
      .insert(productCategories)
      .values(
        categoryNames.map((name, index) => ({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `Enterprise and home-ready ${name.toLowerCase()} engineered for fiber networks.`,
          sortOrder: index + 1,
        }))
      )
      .onConflictDoNothing();
  }

  const allCats = await db.select().from(productCategories);
  const catMap = new Map(allCats.map((c) => [c.name, c.id]));

  const IMG_ROUTER = '/src/assets/images/product_wifi_router_1795011448054.jpg';
  const IMG_ONT = '/src/assets/images/product_fiber_ont_1795011448679.jpg';
  const IMG_SWITCH = '/src/assets/images/product_network_switch_1795011449285.jpg';
  const IMG_CABLES = '/src/assets/images/product_fiber_cables_1795011449529.jpg';

  // 6. Seed Networking Products
  const [{ value: prodCount }] = await db
    .select({ value: count() })
    .from(products);
  if (Number(prodCount) === 0) {
    await db
      .insert(products)
      .values([
        {
          name: 'StarWave BE9300 Wi-Fi 7 Tri-Band Mesh Router',
          slug: 'starwave-be9300-wifi-7-router',
          categoryId: catMap.get('Wi-Fi Routers') ?? null,
          categoryName: 'Wi-Fi Routers',
          brand: 'StarNet Hardware',
          modelNumber: 'SW-BE9300',
          description: 'Tri-band Wi-Fi 7 router with 2.5G WAN/LAN ports, Multi-Link Operation (MLO), and coverage up to 3,200 sq. ft. Built for gigabit fiber connections.',
          specs: { 'Wireless Standard': 'Wi-Fi 7 (802.11be)', 'Aggregate Speed': '9.3 Gbps', 'WAN/LAN Ports': '1x 2.5G WAN + 4x 2.5G LAN', 'Coverage': '3,200 sq. ft.' },
          sellingPrice: '12499.00',
          originalPrice: '14999.00',
          discountPercent: 17,
          stockQuantity: 28,
          warranty: '3 Years StarNet Replacement Warranty',
          images: [IMG_ROUTER, IMG_SWITCH],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'StarLink AX3000 Dual-Band Gigabit Router',
          slug: 'starlink-ax3000-wifi-6-router',
          categoryId: catMap.get('Wi-Fi Routers') ?? null,
          categoryName: 'Wi-Fi Routers',
          brand: 'TP-Link',
          modelNumber: 'ARCHER-AX55-SF',
          description: 'Reliable Wi-Fi 6 dual-band router tuned for 300–600 Mbps fiber connections with OFDMA, Beamforming, and WPA3 encryption.',
          specs: { 'Wireless Standard': 'Wi-Fi 6 (802.11ax)', 'Bandwidth': '3000 Mbps', 'Ports': '1x GbE WAN + 4x GbE LAN', 'Security': 'WPA3 Personal & Enterprise' },
          sellingPrice: '4299.00',
          originalPrice: '5499.00',
          discountPercent: 22,
          stockQuantity: 45,
          warranty: '2 Years Manufacturer Warranty',
          images: [IMG_ROUTER],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'OptiCore XGS-PON 10G Fiber ONT Terminal',
          slug: 'opticore-xgs-pon-10g-ont',
          categoryId: catMap.get('Fiber ONT Devices') ?? null,
          categoryName: 'Fiber ONT Devices',
          brand: 'OptiCore',
          modelNumber: 'OC-XGS-100',
          description: 'Carrier-grade XGS-PON / GPON optical network terminal with SC/APC simplex fiber port, 10G RJ45 LAN, and brushed aluminum thermal dissipation.',
          specs: { 'Optical Interface': 'SC/APC Simplex', 'PON Standard': 'ITU-T G.9807.1 XGS-PON', 'Ethernet': '1x 10GbE + 1x 2.5GbE', 'Power Input': '12V DC 1.5A' },
          sellingPrice: '3899.00',
          originalPrice: '4599.00',
          discountPercent: 15,
          stockQuantity: 19,
          warranty: '2 Years Hardware Warranty',
          images: [IMG_ONT],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'FiberBridge GPON 1GE+1FE Bridge ONU',
          slug: 'fiberbridge-gpon-onu-device',
          categoryId: catMap.get('ONU Devices') ?? null,
          categoryName: 'ONU Devices',
          brand: 'Syrotech',
          modelNumber: 'SY-GPON-1110',
          description: 'Compact single-port gigabit GPON/EPON dual-mode ONU in bridge or router mode for residential FTTH drops.',
          specs: { 'Optical Sensitivity': '-28 dBm', 'Wavelength': 'Tx 1310nm / Rx 1490nm', 'Port': '1x 10/100/1000M RJ45', 'Mode': 'Bridge / PPPoE' },
          sellingPrice: '1499.00',
          originalPrice: '1999.00',
          discountPercent: 25,
          stockQuantity: 62,
          warranty: '1 Year Warranty',
          images: [IMG_ONT],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'NetSwitch Pro 8-Port 2.5G Managed PoE+ Switch',
          slug: 'netswitch-pro-8port-25g-poe',
          categoryId: catMap.get('Network Switches') ?? null,
          categoryName: 'Network Switches',
          brand: 'Netgear',
          modelNumber: 'MS510TXM-SF',
          description: 'Enterprise 8-port 2.5G multi-gigabit managed switch with 2x 10G SFP+ fiber uplinks, VLAN segmentation, and 180W PoE+ budget.',
          specs: { 'Ports': '8x 2.5G PoE+ + 2x 10G SFP+', 'Switching Capacity': '80 Gbps', 'PoE Budget': '180W IEEE 802.3at', 'Chassis': 'Anodized Aluminum' },
          sellingPrice: '18999.00',
          originalPrice: '22499.00',
          discountPercent: 16,
          stockQuantity: 7,
          warranty: '5 Years ProSAFE Warranty',
          images: [IMG_SWITCH],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'SFP+ 10GBASE-LR Single-Mode Optical Transceiver',
          slug: 'sfp-plus-10g-optical-transceiver',
          categoryId: catMap.get('Optical Network Equipment') ?? null,
          categoryName: 'Optical Network Equipment',
          brand: 'FS Telecom',
          modelNumber: 'SFP-10GLR-31',
          description: '10GBASE-LR SFP+ 1310nm 10km single-mode LC duplex optical transceiver with DDM telemetry for fiber switches and OLT uplinks.',
          specs: { 'Data Rate': '10.3 Gbps', 'Reach': '10 km (SMF)', 'Connector': 'Dual LC/UPC', 'Wavelength': '1310 nm' },
          sellingPrice: '2199.00',
          originalPrice: '2799.00',
          discountPercent: 21,
          stockQuantity: 34,
          warranty: '3 Years Warranty',
          images: [IMG_SWITCH, IMG_CABLES],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'Armored Single-Mode SC/APC Fiber Optic Cable (20m)',
          slug: 'armored-sc-apc-fiber-cable-20m',
          categoryId: catMap.get('Fiber Optic Cables') ?? null,
          categoryName: 'Fiber Optic Cables',
          brand: 'Corning Glass',
          modelNumber: 'CF-SM-20M-APC',
          description: 'Low-loss bend-insensitive G.657.A2 single-mode armored outdoor/indoor fiber drop cable terminated with factory-polished SC/APC connectors.',
          specs: { 'Fiber Type': 'OS2 9/125μm G.657.A2', 'Insertion Loss': '< 0.20 dB', 'Length': '20 Meters', 'Jacket': 'LSZH Armored Blue' },
          sellingPrice: '799.00',
          originalPrice: '999.00',
          discountPercent: 20,
          stockQuantity: 85,
          warranty: '5 Years Signal Integrity Warranty',
          images: [IMG_CABLES],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'Shielded Cat 6A S/FTP 10Gbps Ethernet Cable (15m)',
          slug: 'cat6a-sftp-ethernet-cable-15m',
          categoryId: catMap.get('Ethernet Cables') ?? null,
          categoryName: 'Ethernet Cables',
          brand: 'Belkin Pro',
          modelNumber: 'BK-C6A-15M',
          description: '26AWG pure bare copper Cat 6A S/FTP shielded patch cable rated for 500 MHz and 10GBASE-T high-speed links.',
          specs: { 'Category': 'Cat 6A S/FTP', 'Bandwidth': '500 MHz / 10 Gbps', 'Conductor': 'Pure Bare Copper', 'Length': '15 Meters' },
          sellingPrice: '649.00',
          originalPrice: '849.00',
          discountPercent: 24,
          stockQuantity: 110,
          warranty: '2 Years Warranty',
          images: [IMG_CABLES],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'Gold-Plated Cat 6A Pass-Through RJ45 LAN Connectors (50 Pack)',
          slug: 'cat6a-rj45-lan-connectors-50pack',
          categoryId: catMap.get('LAN Connectors') ?? null,
          categoryName: 'LAN Connectors',
          brand: 'D-Link',
          modelNumber: 'DL-RJ45-50P',
          description: '50-micron gold-plated shielded RJ45 modular pass-through plugs for fast, zero-crosstalk field termination.',
          specs: { 'Plating': '50μ Gold Prongs', 'Shielding': 'Nickel-Plated Brass', 'Quantity': '50 Connectors + Boots', 'Compatibility': 'Cat 6 / Cat 6A' },
          sellingPrice: '499.00',
          originalPrice: '699.00',
          discountPercent: 29,
          stockQuantity: 6,
          warranty: '1 Year Warranty',
          images: [IMG_CABLES],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'StarMesh AX1800 Wall-Plug Wi-Fi 6 Range Extender',
          slug: 'starmesh-ax1800-wifi-extender',
          categoryId: catMap.get('Wi-Fi Extenders') ?? null,
          categoryName: 'Wi-Fi Extenders',
          brand: 'StarNet Hardware',
          modelNumber: 'SM-AX1800',
          description: 'Seamless EasyMesh Wi-Fi 6 repeater with Gigabit Ethernet backhaul port to eliminate dead zones in multi-story homes.',
          specs: { 'Speed': '1800 Mbps Dual-Band', 'Ethernet': '1x Gigabit Port', 'Mesh Support': 'EasyMesh Certified', 'Coverage Boost': '+1,500 sq. ft.' },
          sellingPrice: '2799.00',
          originalPrice: '3499.00',
          discountPercent: 20,
          stockQuantity: 22,
          warranty: '2 Years Warranty',
          images: [IMG_ROUTER],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'Gigabit Single-Mode Fiber-to-Ethernet Media Converter',
          slug: 'gigabit-fiber-media-converter',
          categoryId: catMap.get('Media Converters') ?? null,
          categoryName: 'Media Converters',
          brand: 'TP-Link',
          modelNumber: 'MC210CS-SF',
          description: 'Converts 1000BASE-LX single-mode SC fiber to 1000BASE-T copper Ethernet up to 20 km distance.',
          specs: { 'Max Distance': '20 km', 'Fiber Port': 'SC/UPC Dual', 'Copper Port': '10/100/1000M RJ45', 'Enclosure': 'Steel Industrial' },
          sellingPrice: '2399.00',
          originalPrice: '2899.00',
          discountPercent: 17,
          stockQuantity: 15,
          warranty: '2 Years Warranty',
          images: [IMG_SWITCH],
          isFeatured: false,
          isActive: true,
        },
        {
          name: 'Simplex SC/APC to SC/APC Fiber Patch Cord (3m)',
          slug: 'simplex-sc-apc-patch-cord-3m',
          categoryId: catMap.get('Patch Cords') ?? null,
          categoryName: 'Patch Cords',
          brand: 'CommScope',
          modelNumber: 'CS-APC-3M',
          description: 'Low-return-loss green-booted SC/APC optical patch cord for wall rosette to ONT terminal connection.',
          specs: { 'Return Loss': '> 60 dB', 'Core': '9/125μm Single-Mode', 'Length': '3 Meters', 'Diameter': '3.0 mm LSZH' },
          sellingPrice: '299.00',
          originalPrice: '399.00',
          discountPercent: 25,
          stockQuantity: 140,
          warranty: '2 Years Warranty',
          images: [IMG_CABLES],
          isFeatured: false,
          isActive: true,
        },
        {
          name: '12V 2A Low-Noise Router & ONT Power Adapter + Mini UPS',
          slug: 'router-ont-12v-mini-ups-adapter',
          categoryId: catMap.get('Power Adapters') ?? null,
          categoryName: 'Power Adapters',
          brand: 'APC Fiber',
          modelNumber: 'APC-12V-UPS',
          description: 'Uninterrupted 12V 2A power adapter with 8800mAh lithium backup providing up to 5 hours of fiber Wi-Fi uptime during power cuts.',
          specs: { 'Output': '12V DC / 2.0A', 'Battery': '8800 mAh LiFePO4', 'Backup Time': 'Up to 5 Hours', 'Switchover': '0 ms Zero-Drop' },
          sellingPrice: '1699.00',
          originalPrice: '2199.00',
          discountPercent: 23,
          stockQuantity: 8,
          warranty: '1 Year Battery Warranty',
          images: [IMG_ONT],
          isFeatured: true,
          isActive: true,
        },
        {
          name: 'FTTH Wall Outlet Rosette Box & Splice Protection Kit',
          slug: 'ftth-wall-rosette-splice-kit',
          categoryId: catMap.get('Installation Accessories') ?? null,
          categoryName: 'Installation Accessories',
          brand: 'StarNet Hardware',
          modelNumber: 'SN-FTTH-BOX',
          description: 'Clean white wall-mounted fiber termination faceplate with SC/APC coupler, splice tray, and 10 fusion sleeves.',
          specs: { 'Ports': '2x SC/APC Duplex', 'Material': 'Flame-Retardant ABS', 'Mounting': 'Flush / Surface Wall', 'Includes': '10x Splice Sleeves' },
          sellingPrice: '349.00',
          originalPrice: '449.00',
          discountPercent: 22,
          stockQuantity: 74,
          warranty: '2 Years Warranty',
          images: [IMG_CABLES],
          isFeatured: false,
          isActive: true,
        },
      ])
      .onConflictDoNothing();
  }

  // 7. Seed Technicians
  const [{ value: techCount }] = await db
    .select({ value: count() })
    .from(technicians);
  if (Number(techCount) === 0) {
    await db
      .insert(technicians)
      .values([
        { name: 'Arun Kumar', phone: '+91 98451 11220', specialty: 'FTTH Splicing & GPON', zone: 'Indiranagar & Central', isActive: true },
        { name: 'Vikram Nair', phone: '+91 98451 22330', specialty: 'Enterprise DIA & Mesh Wi-Fi', zone: 'Electronic City & South', isActive: true },
        { name: 'Meena Krishnan', phone: '+91 98451 33440', specialty: 'ONT Configuration & RF', zone: 'HITEC & Metro Grid', isActive: true },
        { name: 'Rohan Verma', phone: '+91 98451 44550', specialty: 'Structured Cat 6A Cabling', zone: 'Koramangala & West', isActive: true },
      ])
      .onConflictDoNothing();
  }

  // 8. Seed Coupons
  const [{ value: couponCount }] = await db
    .select({ value: count() })
    .from(coupons);
  if (Number(couponCount) === 0) {
    await db
      .insert(coupons)
      .values([
        { code: 'STARFIBER10', discountType: 'percent', discountValue: '10.00', minOrderAmount: '1000.00', isActive: true },
        { code: 'WELCOME200', discountType: 'flat', discountValue: '200.00', minOrderAmount: '1500.00', isActive: true },
      ])
      .onConflictDoNothing();
  }

  // 9. Seed Realistic Bookings, Installations, Orders & Tickets for Customer & Admin Dashboard Metrics
  const [{ value: orderCount }] = await db.select({ value: count() }).from(orders);
  if (Number(orderCount) === 0) {
    const allUsers = await db.select().from(users);
    const customer = allUsers.find((u) => u.role === 'customer') ?? allUsers[0];
    const allPlans = await db.select().from(internetPlans);
    const stdPlan = allPlans.find((p) => p.slug === 'standard-fiber-300') ?? allPlans[0];
    const busPlan = allPlans.find((p) => p.slug === 'business-leased-1000') ?? allPlans[0];
    const allProds = await db.select().from(products);
    const routerProd = allProds[0];
    const ontProd = allProds[2];
    const allTechs = await db.select().from(technicians);

    if (customer && stdPlan && busPlan) {
      await db
        .insert(bookings)
        .values([
          {
            bookingCode: 'SFB-2026-1001',
            userId: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            mobile: customer.mobile,
            altMobile: '+91 98450 99100',
            address: 'Flat 402, Emerald Towers, 12th Main Indiranagar',
            city: 'Bengaluru',
            district: 'Bengaluru Urban',
            pinCode: '560038',
            connectionType: 'Home',
            planId: stdPlan.id,
            planName: stdPlan.name,
            preferredDate: '2026-11-20',
            notes: 'Need fiber drop routed cleanly into study room.',
            status: 'Scheduled',
            adminNotes: 'Feasibility verified; optical splitter port 4 reserved.',
          },
          {
            bookingCode: 'SFB-2026-1002',
            userId: null,
            fullName: 'Karthik Rajagopal',
            email: 'karthik.ops@novatech.in',
            mobile: '+91 99001 77420',
            address: 'Suite 3B, Orion Business Park, Electronic City',
            city: 'Bengaluru',
            district: 'Bengaluru Urban',
            pinCode: '560100',
            connectionType: 'Business',
            planId: busPlan.id,
            planName: busPlan.name,
            preferredDate: '2026-11-22',
            notes: 'Requires static IPv4 and rack-mount ONT handoff.',
            status: 'Pending',
            adminNotes: '',
          },
        ])
        .onConflictDoNothing();

      await db
        .insert(installationRequests)
        .values([
          {
            requestCode: 'INS-2026-2001',
            userId: customer.id,
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: customer.mobile,
            serviceAddress: 'Flat 402, Emerald Towers, Indiranagar, Bengaluru 560038',
            requestType: 'New connection installation',
            preferredDate: '2026-11-20',
            timeSlot: '10:00 AM - 01:00 PM',
            description: 'Initial fiber termination and Wi-Fi 7 mesh setup.',
            technicianId: allTechs[0]?.id ?? null,
            technicianName: allTechs[0]?.name ?? 'Arun Kumar',
            status: 'Scheduled',
            internalNotes: 'Carry 20m armored patch cord and SC/APC rosette.',
          },
          {
            requestCode: 'INS-2026-2002',
            userId: null,
            customerName: 'Ananya Deshmukh',
            customerEmail: 'ananya.d@example.com',
            customerPhone: '+91 98201 55110',
            serviceAddress: '14 Lotus Enclave, HITEC City, Hyderabad 500081',
            requestType: 'Router replacement',
            preferredDate: '2026-11-21',
            timeSlot: '02:00 PM - 05:00 PM',
            description: 'Upgrading legacy single-band router to dual-band AX3000.',
            status: 'Pending',
            internalNotes: '',
          },
        ])
        .onConflictDoNothing();

      if (routerProd && ontProd) {
        const [ord1] = await db
          .insert(orders)
          .values({
            orderCode: 'ORD-2026-5001',
            userId: customer.id,
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: customer.mobile,
            shippingAddress: 'Flat 402, Emerald Towers, Indiranagar, Bengaluru 560038',
            subtotal: '16398.00',
            discountAmount: '0.00',
            shippingFee: '0.00',
            taxAmount: '2951.64',
            totalAmount: '19349.64',
            paymentMethod: 'UPI',
            paymentStatus: 'Paid',
            orderStatus: 'Delivered',
            trackingNumber: 'SF-BLR-884210',
          })
          .returning();

        if (ord1) {
          await db.insert(orderItems).values([
            {
              orderId: ord1.id,
              productId: routerProd.id,
              productName: routerProd.name,
              modelNumber: routerProd.modelNumber,
              unitPrice: routerProd.sellingPrice,
              quantity: 1,
              lineTotal: routerProd.sellingPrice,
            },
            {
              orderId: ord1.id,
              productId: ontProd.id,
              productName: ontProd.name,
              modelNumber: ontProd.modelNumber,
              unitPrice: ontProd.sellingPrice,
              quantity: 1,
              lineTotal: ontProd.sellingPrice,
            },
          ]);

          await db.insert(payments).values({
            orderId: ord1.id,
            userId: customer.id,
            gateway: 'Razorpay',
            gatewayOrderId: 'order_SF20265001',
            gatewayPaymentId: 'pay_SF99281741',
            gatewaySignature: 'verified_hmac_seed',
            amount: '19349.64',
            currency: 'INR',
            method: 'UPI',
            status: 'Verified',
          });

          await db.insert(invoices).values({
            invoiceNumber: 'INV-SF-2026-5001',
            orderId: ord1.id,
            userId: customer.id,
            subtotal: '16398.00',
            taxAmount: '2951.64',
            shippingFee: '0.00',
            discountAmount: '0.00',
            totalAmount: '19349.64',
          });
        }

        const [ord2] = await db
          .insert(orders)
          .values({
            orderCode: 'ORD-2026-5002',
            userId: customer.id,
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: customer.mobile,
            shippingAddress: 'Flat 402, Emerald Towers, Indiranagar, Bengaluru 560038',
            subtotal: '4299.00',
            discountAmount: '0.00',
            shippingFee: '0.00',
            taxAmount: '773.82',
            totalAmount: '5072.82',
            paymentMethod: 'Credit Card',
            paymentStatus: 'Paid',
            orderStatus: 'Shipped',
            trackingNumber: 'SF-BLR-884992',
          })
          .returning();

        if (ord2 && allProds[1]) {
          await db.insert(orderItems).values({
            orderId: ord2.id,
            productId: allProds[1].id,
            productName: allProds[1].name,
            modelNumber: allProds[1].modelNumber,
            unitPrice: allProds[1].sellingPrice,
            quantity: 1,
            lineTotal: allProds[1].sellingPrice,
          });
          await db.insert(payments).values({
            orderId: ord2.id,
            userId: customer.id,
            gateway: 'Razorpay',
            gatewayOrderId: 'order_SF20265002',
            gatewayPaymentId: 'pay_SF99281888',
            gatewaySignature: 'verified_hmac_seed',
            amount: '5072.82',
            currency: 'INR',
            method: 'Credit Card',
            status: 'Verified',
          });
          await db.insert(invoices).values({
            invoiceNumber: 'INV-SF-2026-5002',
            orderId: ord2.id,
            userId: customer.id,
            subtotal: '4299.00',
            taxAmount: '773.82',
            shippingFee: '0.00',
            discountAmount: '0.00',
            totalAmount: '5072.82',
          });
        }
      }

      await db
        .insert(supportTickets)
        .values({
          ticketCode: 'TKT-1041',
          userId: customer.id,
          subject: 'Requesting Static IPv4 activation check',
          category: 'Technical Support',
          description: 'Looking to enable port forwarding for home NAS on our Standard Plan.',
          priority: 'Medium',
          status: 'Open',
          adminReply: '',
        })
        .onConflictDoNothing();

      await db
        .insert(notifications)
        .values([
          {
            userId: customer.id,
            title: 'Installation Scheduled',
            message: 'Technician Arun Kumar is assigned to INS-2026-2001 for 2026-11-20 (10:00 AM - 01:00 PM).',
            type: 'installation',
            isRead: false,
          },
          {
            userId: customer.id,
            title: 'Order ORD-2026-5002 Shipped',
            message: 'Your StarLink AX3000 router has shipped via Star Logistics (Tracking: SF-BLR-884992).',
            type: 'order',
            isRead: false,
          },
        ])
        .onConflictDoNothing();
    }
  }
}
