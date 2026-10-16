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
 * Generates downloadable CSV template content for users.
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

  const rows = [
    [
      'TXN_SAMPLE_001',
      new Date(Date.now() - 3600000 * 2).toISOString(),
      'rahul.sharma@okaxis',
      'Rahul Sharma',
      'chaiwala.tapri@paytm',
      'Sharma Tea Stall',
      '30',
      'UPI_P2M',
      '5499',
      'Food & Beverages',
      'Mumbai',
      'DVM_ARM64_OEM_PIXEL8_VERIFIED',
      '103.21.124.8'
    ],
    [
      'TXN_SAMPLE_002',
      new Date(Date.now() - 3600000).toISOString(),
      'rahul.sharma@okaxis',
      'Rahul Sharma',
      'swiggy.orders@icici',
      'Swiggy India',
      '480',
      'UPI_P2M',
      '5812',
      'Online Food Delivery',
      'Mumbai',
      'DVM_ARM64_OEM_PIXEL8_VERIFIED',
      '103.21.124.8'
    ],
    [
      'TXN_SAMPLE_003',
      new Date().toISOString(),
      'rahul.sharma@okaxis',
      'Rahul Sharma',
      'vip.bet99.laund@muleupi',
      'Bet99 Gaming Escrow',
      '75000',
      'UPI_P2P',
      '7995',
      'Online Gambling & Betting',
      'London',
      'ROOTED_GENYMOTION_EMULATOR_FAIL',
      '185.220.101.5'
    ]
  ];

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
