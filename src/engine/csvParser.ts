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
  if (/^(amount|txnamount|debitamount|inr|value|amountinr)$/.test(cleaned)) return 'amount';
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

    const deviceFingerprint = rowObj['deviceFingerprint'] || 'OEM_ARM64_SAMSUNG_A54_VERIFIED';
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
  const normalDevice = 'OEM_ARM64_PIXEL8_VERIFIED';
  const normalIp = '103.21.124.8';

  const rows: string[][] = [];
  const baseTimestamp = Date.now() - 15 * 24 * 3600 * 1000; // 15 days ago

  // 1. Generate 85 Authentic Everyday Transactions (Verdict: SAFE - Green)
  for (let i = 1; i <= 85; i++) {
    const m = merchants[(i - 1) % merchants.length];
    const txnTime = new Date(baseTimestamp + i * 4 * 3600 * 1000).toISOString();
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

  // 2. Add 9 Compliance Review Transactions (Verdict: REVIEW / SUSPICIOUS - Amber)
  // 2a. Midnight Off-Hours High-Value Transfers (3:15 AM & 3:45 AM IST)
  // 3:15 AM IST = 21:45 UTC previous day
  const midnightTime1 = new Date(Date.now() - 4 * 24 * 3600 * 1000);
  midnightTime1.setUTCHours(21, 45, 0, 0); // 3:15 AM IST
  rows.push([
    'TXN_TEMPLATE_REV_01_MIDNIGHT',
    midnightTime1.toISOString(),
    senderVpa,
    senderName,
    'unverified.contractor@sbi',
    'Rameshwar Yadav (Contractor)',
    '32000',
    'UPI_P2P',
    '0000',
    'Peer-to-Peer Transfer',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  const midnightTime2 = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  midnightTime2.setUTCHours(22, 15, 0, 0); // 3:45 AM IST
  rows.push([
    'TXN_TEMPLATE_REV_02_MIDNIGHT',
    midnightTime2.toISOString(),
    senderVpa,
    senderName,
    'ananya.newpayee@hdfcbank',
    'Ananya Sen (Interior Design)',
    '28500',
    'UPI_P2P',
    '0000',
    'Peer-to-Peer Transfer',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // 2b. High-Risk MCC Quasi-Cash / Crypto Deposit on Clean Device (MCC 6051)
  rows.push([
    'TXN_TEMPLATE_REV_03_MCC6051',
    new Date(Date.now() - 6 * 24 * 3600 * 1000 + 14 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'wazirx.crypto.inr@kotak',
    'WazirX Digital Assets Exchange',
    '26000',
    'UPI_P2M',
    '6051',
    'Quasi-Cash / Crypto Mixers',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // 2c. High-Risk MCC Precious Stones & Bullion on Clean Device (MCC 5094)
  rows.push([
    'TXN_TEMPLATE_REV_04_MCC5094',
    new Date(Date.now() - 5 * 24 * 3600 * 1000 + 17 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'tanishq.bullion.mumbai@icici',
    'Tanishq Gold Bullion Counter',
    '29500',
    'UPI_P2M',
    '5094',
    'Precious Stones, Metals & Jewelry',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // 2d. Unverified First-Time P2P Payee Transfers
  rows.push([
    'TXN_TEMPLATE_REV_05_UNVERIFIED',
    new Date(Date.now() - 2 * 24 * 3600 * 1000 + 11 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'unverified.freelancer.dev@axisbank',
    'Kavita Nair (First Time Payee)',
    '31000',
    'UPI_P2P',
    '0000',
    'Peer-to-Peer Transfer',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  rows.push([
    'TXN_TEMPLATE_REV_06_NEWPAYEE',
    new Date(Date.now() - 2 * 24 * 3600 * 1000 + 16 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'newpayee.vendor.hardware@sbi',
    'Modern Tech Supplies (Unverified)',
    '33000',
    'UPI_P2P',
    '0000',
    'Peer-to-Peer Transfer',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // 2e. Velocity Surge Alerts Approaching Limit
  rows.push([
    'TXN_TEMPLATE_REV_07_VELOCITY_WARNING',
    new Date(Date.now() - 1 * 24 * 3600 * 1000 + 10 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'blinkit.express@kotak',
    'Blinkit Quick Delivery',
    '12000',
    'UPI_P2M',
    '5411',
    'Supermarket & Groceries',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  rows.push([
    'TXN_TEMPLATE_REV_08_VELOCITY_WARNING',
    new Date(Date.now() - 1 * 24 * 3600 * 1000 + 10 * 3600 * 1000 + 40000).toISOString(),
    senderVpa,
    senderName,
    'zepto.speedy@axisbank',
    'Zepto Flash Delivery',
    '14500',
    'UPI_P2M',
    '5411',
    'Supermarket & Groceries',
    'Mumbai',
    normalDevice,
    normalIp
  ]);

  // 2f. Rapid Transit / Geo Warning (Mumbai to Pune ground transit)
  rows.push([
    'TXN_TEMPLATE_REV_09_GEO_WARNING',
    new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    senderVpa,
    senderName,
    'uber.intercity@icici',
    'Uber Intercity Mumbai-Pune',
    '15000',
    'UPI_P2M',
    '4121',
    'Taxicabs & Rideshare',
    'Pune',
    normalDevice,
    normalIp
  ]);

  // 3. Add 6 Confirmed Multi-Vector Fraud Attacks (Verdict: FRAUD / FLAG - Red)
  // 3a. Rapid Bot Velocity Burst Attacks (Rooted Emulator + Tor IP)
  const burstTime = Date.now() - 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000;
  rows.push([
    'TXN_TEMPLATE_BURST_01',
    new Date(burstTime + 5000).toISOString(),
    senderVpa,
    senderName,
    'unknown.merchant_1@paytm',
    'Rapid Automated Bot Node #1',
    '18500',
    'UPI_P2M',
    '5999',
    'Miscellaneous Retail',
    'Mumbai',
    'ROOTED_GENYMOTION_EMULATOR_FAIL',
    '185.220.101.5'
  ]);

  rows.push([
    'TXN_TEMPLATE_BURST_02',
    new Date(burstTime + 12000).toISOString(),
    senderVpa,
    senderName,
    'unknown.merchant_2@paytm',
    'Rapid Automated Bot Node #2',
    '19500',
    'UPI_P2M',
    '5999',
    'Miscellaneous Retail',
    'Mumbai',
    'ROOTED_GENYMOTION_EMULATOR_FAIL',
    '185.220.101.5'
  ]);

  // 3b. Impossible Travel Geo-Drift Anomaly (Mumbai to London 7,200 km jump in 12 mins)
  rows.push([
    'TXN_TEMPLATE_GEO_FRAUD',
    new Date(Date.now() - 1 * 24 * 3600 * 1000 + 18 * 3600 * 1000).toISOString(),
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

  // 3c. Illegal Offshore Gambling Syndicate (Bet99 - MCC 7995 on Bluestacks Emulator)
  rows.push([
    'TXN_TEMPLATE_MCC_GAMBLING',
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

  // 3d. Mule Syndicate Liquidation Drains (MCC 6011 Quasi-Cash on Rooted Phone)
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

  // Exact 100 records: 85 Safe (85%), 9 Review (9%), 6 Fraud (6%)
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
