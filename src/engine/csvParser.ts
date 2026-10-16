import { StatementTransaction, ChannelType } from '../types';

/**
 * Robust CSV Line Tokenizer handling quotes and escaped characters.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes header string to match standard field keys.
 */
function normalizeHeader(header: string): string {
  const cleaned = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(txnid|transactionid|refno|reference|id)$/.test(cleaned)) return 'id';
  if (/^(date|timestamp|txndate|datetime|time)$/.test(cleaned)) return 'timestamp';
  if (/^(sendervpa|sender|fromvpa|fromupi|debitfrom|source)$/.test(cleaned)) return 'senderVpa';
  if (/^(sendername|fromname|payername)$/.test(cleaned)) return 'senderName';
  if (/^(receivervpa|receiver|tovpa|toupi|beneficiaryvpa|beneficiary|payeename)$/.test(cleaned)) return 'receiverVpa';
  if (/^(receivername|toname|beneficiaryname|merchantname)$/.test(cleaned)) return 'receiverName';
  if (/^(amount|txnamount|debitamount|inr|value)$/.test(cleaned)) return 'amount';
  if (/^(channel|type|paymentmode|mode)$/.test(cleaned)) return 'channel';
  if (/^(mcc|merchantcode)$/.test(cleaned)) return 'mcc';
  if (/^(mcccategory|category|purposename|merchanttype)$/.test(cleaned)) return 'mccCategory';
  if (/^(city|location|place)$/.test(cleaned)) return 'city';
  if (/^(lat|latitude)$/.test(cleaned)) return 'lat';
  if (/^(lon|long|longitude)$/.test(cleaned)) return 'lon';
  if (/^(devicefingerprint|deviceid|device|handset)$/.test(cleaned)) return 'deviceFingerprint';
  if (/^(ipaddress|ip|clientip)$/.test(cleaned)) return 'ipAddress';
  return cleaned;
}

/**
 * City Lat/Lon lookup helper for automatic geocoding if coordinates are missing.
 */
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  mumbai: { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  pune: { lat: 18.5204, lon: 73.8567 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  london: { lat: 51.5074, lon: -0.1278 },
  dubai: { lat: 25.2048, lon: 55.2708 },
};

/**
 * Parses raw CSV text into validated StatementTransaction records.
 */
export function parseBankStatementCsv(csvText: string): {
  transactions: StatementTransaction[];
  errors: string[];
} {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { transactions: [], errors: ['CSV file is empty or missing data rows.'] };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);
  const transactions: StatementTransaction[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 2) continue; // skip blank line

    const rowObj: Record<string, string> = {};
    headers.forEach((h, index) => {
      rowObj[h] = values[index] || '';
    });

    const id = rowObj['id'] || `txn_${Date.now()}_${i}`;
    const timestamp = rowObj['timestamp'] ? new Date(rowObj['timestamp']).toISOString() : new Date().toISOString();
    const senderVpa = rowObj['senderVpa'] || 'user@okhdfcbank';
    const senderName = rowObj['senderName'] || 'Account Holder';
    const receiverVpa = rowObj['receiverVpa'] || 'merchant@upi';
    const receiverName = rowObj['receiverName'] || 'Registered Payee';
    
    // Clean currency string (e.g. ₹4,500.00 -> 4500)
    const rawAmount = (rowObj['amount'] || '0').replace(/[^0-9.-]+/g, '');
    const amount = Math.abs(parseFloat(rawAmount)) || 100;

    const channelRaw = (rowObj['channel'] || 'UPI_P2P').toUpperCase();
    const channel: ChannelType = ['UPI_P2P', 'UPI_P2M', 'IMPS', 'NET_BANKING'].includes(channelRaw)
      ? (channelRaw as ChannelType)
      : 'UPI_P2P';

    const mcc = rowObj['mcc'] || '5411';
    const mccCategory = rowObj['mccCategory'] || 'Grocery / Supermarket';
    const city = rowObj['city'] || 'Mumbai';
    
    // Auto-resolve Lat/Lon from city or default
    const cityLookup = CITY_COORDINATES[city.toLowerCase()] || CITY_COORDINATES['mumbai'];
    const lat = rowObj['lat'] ? parseFloat(rowObj['lat']) : cityLookup.lat;
    const lon = rowObj['lon'] ? parseFloat(rowObj['lon']) : cityLookup.lon;

    const deviceFingerprint = rowObj['deviceFingerprint'] || 'DVM_ARM64_OEM_SAMSUNG_A54_HASH9182';
    const ipAddress = rowObj['ipAddress'] || '49.207.210.45';

    transactions.push({
      id,
      timestamp,
      senderVpa,
      senderName,
      receiverVpa,
      receiverName,
      amount,
      currency: 'INR',
      channel,
      mcc,
      mccCategory,
      city,
      lat,
      lon,
      deviceFingerprint,
      ipAddress
    });
  }

  return { transactions, errors };
}

/**
 * Generates downloadable CSV template content with at least 100 realistic mock records.
 */
export function generateSampleCsvTemplate(): string {
  const headers = [
    'Txn_ID',
    'Date_Time',
    'Sender_VPA',
    'Sender_Name',
    'Receiver_VPA',
    'Receiver_Name',
    'Amount_INR',
    'Channel',
    'MCC',
    'Category',
    'City',
    'Device_Fingerprint',
    'IP_Address'
  ];

  const merchants = [
    { name: 'Chai Point / Local Tea Stall', vpa: 'chaipoint.mum@paytm', mcc: '5499', cat: 'Fast Food & Beverages', base: 40, city: 'Mumbai' },
    { name: 'Swiggy Online Food', vpa: 'swiggy.orders@icici', mcc: '5812', cat: 'Online Food Delivery', base: 450, city: 'Mumbai' },
    { name: 'Zomato Limited', vpa: 'zomato.pay@hdfcbank', mcc: '5812', cat: 'Online Food Delivery', base: 520, city: 'Mumbai' },
    { name: 'Blinkit Instant Commerce', vpa: 'blinkit.groceries@kotak', mcc: '5411', cat: 'Supermarket & Groceries', base: 850, city: 'Mumbai' },
    { name: 'Zepto Quick Grocery', vpa: 'zepto.mum@axisbank', mcc: '5411', cat: 'Supermarket & Groceries', base: 620, city: 'Mumbai' },
    { name: 'Adani Electricity Mumbai', vpa: 'adanipower.mum@sbi', mcc: '4900', cat: 'Utilities / Power', base: 2450, city: 'Mumbai' },
    { name: 'Airtel Fiber Broadband', vpa: 'airtel.bills@airtelbank', mcc: '4814', cat: 'Telecommunication', base: 1179, city: 'Mumbai' },
    { name: 'Uber Rides India', vpa: 'uber.india@icici', mcc: '4121', cat: 'Taxicabs & Rideshare', base: 340, city: 'Mumbai' },
    { name: 'Ola Cabs Transit', vpa: 'olacabs@axisbank', mcc: '4121', cat: 'Taxicabs & Rideshare', base: 280, city: 'Mumbai' },
    { name: 'Indian Oil Fuel Pump', vpa: 'indianoil.andheri@sbi', mcc: '5541', cat: 'Service Stations / Fuel', base: 1500, city: 'Mumbai' },
    { name: 'Shell Fuel Station', vpa: 'shell.retail@hdfcbank', mcc: '5541', cat: 'Service Stations / Fuel', base: 2200, city: 'Mumbai' },
    { name: 'Apollo Pharmacy Bandra', vpa: 'apollopharmacy@axisbank', mcc: '5912', cat: 'Pharmacies & Drugs', base: 680, city: 'Mumbai' },
    { name: 'MedPlus Chemist', vpa: 'medplus.mum@icici', mcc: '5912', cat: 'Pharmacies & Drugs', base: 420, city: 'Mumbai' },
    { name: 'Decathlon Sports Andheri', vpa: 'decathlon.andheri@hdfcbank', mcc: '5941', cat: 'Sporting Goods', base: 3400, city: 'Mumbai' },
    { name: 'Amazon India Shopping', vpa: 'amazonpay.retail@axisbank', mcc: '5311', cat: 'Department Stores / E-Commerce', base: 1890, city: 'Mumbai' },
    { name: 'Flipkart Internet Retail', vpa: 'flipkart.orders@kotak', mcc: '5311', cat: 'Department Stores / E-Commerce', base: 2150, city: 'Mumbai' },
    { name: 'Priya Verma (P2P Split)', vpa: 'priya.verma@okhdfcbank', mcc: '0000', cat: 'Peer-to-Peer Transfer', base: 1200, city: 'Mumbai' },
    { name: 'Amitabh Sen (Dinner Split)', vpa: 'amitabh.sen@okaxis', mcc: '0000', cat: 'Peer-to-Peer Transfer', base: 850, city: 'Mumbai' },
    { name: 'Starbucks Coffee Bandra', vpa: 'starbucks.india@icici', mcc: '5814', cat: 'Fast Food Restaurants', base: 560, city: 'Mumbai' },
    { name: 'D-Mart Supermarket Goregaon', vpa: 'dmart.goregaon@hdfcbank', mcc: '5411', cat: 'Supermarket & Groceries', base: 4200, city: 'Mumbai' }
  ];

  const senderVpa = 'rahul.sharma@okaxis';
  const senderName = 'Rahul Sharma';
  const normalDevice = 'DVM_ARM64_OEM_PIXEL8_VERIFIED';
  const normalIp = '103.21.124.8';

  const rows: string[][] = [];
  const baseTimestamp = Date.now() - 15 * 24 * 3600 * 1000; // 15 days ago

  // 1. Generate 90 Authentic Daily Transactions
  for (let i = 1; i <= 90; i++) {
    const m = merchants[(i - 1) % merchants.length];
    const txnTime = new Date(baseTimestamp + i * 3.8 * 3600 * 1000).toISOString();
    // Deterministic variance around base price
    const amount = Math.max(20, Math.round(m.base * (0.8 + ((i * 17) % 50) / 100)));
    const channel = m.mcc === '0000' ? 'UPI_P2P' : 'UPI_P2M';

    rows.push([
      `TXN_TEMPLATE_${String(i).padStart(3, '0')}`,
      txnTime,
      senderVpa,
      senderName,
      m.vpa,
      m.name,
      amount.toString(),
      channel,
      m.mcc,
      m.cat,
      m.city,
      normalDevice,
      normalIp
    ]);
  }

  // 2. Add 3 Rapid Velocity Burst Transactions (< 60s window)
  const burstTime = Date.now() - 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000;
  for (let b = 1; b <= 3; b++) {
    rows.push([
      `TXN_TEMPLATE_BURST_${b}`,
      new Date(burstTime + b * 9000).toISOString(),
      senderVpa,
      senderName,
      `unknown.merchant_${b}@paytm`,
      `Rapid Automated Node #${b}`,
      '18500',
      'UPI_P2M',
      '5999',
      'Miscellaneous Retail',
      'Mumbai',
      'ROOTED_GENYMOTION_EMULATOR_FAIL',
      '185.220.101.5'
    ]);
  }

  // 3. Add 2 Impossible Travel (Geo-Drift) Transactions
  const geoTime = Date.now() - 1 * 24 * 3600 * 1000 + 18 * 3600 * 1000;
  rows.push([
    'TXN_TEMPLATE_GEO_01',
    new Date(geoTime).toISOString(),
    senderVpa,
    senderName,
    'swiggy.orders@icici',
    'Swiggy Bandra Mumbai',
    '650',
    'UPI_P2M',
    '5812',
    'Online Food Delivery',
    'Mumbai',
    normalDevice,
    normalIp
  ]);
  rows.push([
    'TXN_TEMPLATE_GEO_02',
    new Date(geoTime + 12 * 60 * 1000).toISOString(), // 12 mins later
    senderVpa,
    senderName,
    'harrods.luxury@barclays',
    'Harrods London Dept Store',
    '89000',
    'NET_BANKING',
    '5311',
    'Department Stores (International)',
    'London',
    'LINUX_HEADLESS_CHROME_SPOOF',
    '82.165.197.1'
  ]);

  // 4. Add 2 High-Risk MCC Online Gambling / Betting Transactions (MCC 7995)
  rows.push([
    'TXN_TEMPLATE_MCC_01',
    new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'bet99.casino.cashout@upi',
    'Bet99 Offshore Gaming Portal',
    '65000',
    'UPI_P2M',
    '7995',
    'Online Gambling & Betting',
    'Goa',
    'EMULATOR_BLUESTACKS_MAC_CLONE',
    '104.244.42.1'
  ]);
  rows.push([
    'TXN_TEMPLATE_MCC_02',
    new Date(Date.now() - 34 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'cryptomixer.instant.pay@okaxis',
    'P2P Quasi-Cash Liquidation',
    '52000',
    'UPI_P2P',
    '6051',
    'Quasi-Cash / Crypto Mixers',
    'Mumbai',
    normalDevice,
    '103.21.124.8'
  ]);

  // 5. Add 2 Mule Account Syndicate Funnel Transactions
  rows.push([
    'TXN_TEMPLATE_MULE_01',
    new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'mule.escrow.syndicate_1@ybl',
    'Syndicate Liquidation Mule #1',
    '49500',
    'UPI_P2P',
    '6011',
    'Quasi-Cash / ATM Drain',
    'Delhi',
    'ROOTED_ONEPLUS_OX_SPOOF',
    '185.100.87.2'
  ]);
  rows.push([
    'TXN_TEMPLATE_MULE_02',
    new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'mule.cashout.shell@paytm',
    'Shell Account Liquidation Endpoint',
    '48000',
    'UPI_P2P',
    '6011',
    'Quasi-Cash / ATM Drain',
    'Delhi',
    'ROOTED_ONEPLUS_OX_SPOOF',
    '185.100.87.2'
  ]);

  // 6. Add 1 Suspicious Late-Night High-Value Transfer
  rows.push([
    'TXN_TEMPLATE_SUSPICIOUS_01',
    new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 3:30 AM
    senderVpa,
    senderName,
    'firsttime.recipient.unverified@sbi',
    'Rameshwar Yadav (First Time Recipient)',
    '34000',
    'UPI_P2P',
    '0000',
    'Peer-to-Peer Transfer',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // Total rows = 90 + 3 + 2 + 2 + 2 + 1 = exactly 100 records!
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
