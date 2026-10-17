import { StatementTransaction } from '../types';

/**
 * Generates 250 realistic Indian banking/UPI transactions for testing
 * the fraud detection engine. Contains a realistic mix of authentic everyday
 * transactions (chai, Swiggy, groceries, rent, salary) alongside intentional
 * fraud typologies (rapid velocity bursts, impossible travel, mule drains, high-risk MCC).
 */
export function generate250SampleTransactions(): StatementTransaction[] {
  const transactions: StatementTransaction[] = [];
  const baseTime = Date.now() - 30 * 24 * 3600 * 1000; // 30 days ago
  const senderVpa = 'rahul.sharma@okaxis';
  const senderName = 'Rahul Sharma';

  const authenticMerchants = [
    { name: 'Chai Point / Local Tea Stall', vpa: 'chaipoint.mum@paytm', mcc: '5499', cat: 'Fast Food & Beverages', min: 20, max: 80, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Swiggy Online Food', vpa: 'swiggy.orders@icici', mcc: '5812', cat: 'Online Food Delivery', min: 250, max: 750, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Zomato Limited', vpa: 'zomato.pay@hdfcbank', mcc: '5812', cat: 'Online Food Delivery', min: 300, max: 900, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Blinkit Instant Commerce', vpa: 'blinkit.groceries@kotak', mcc: '5411', cat: 'Supermarket & Groceries', min: 400, max: 1800, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Zepto Quick Grocery', vpa: 'zepto.mum@axisbank', mcc: '5411', cat: 'Supermarket & Groceries', min: 350, max: 1500, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Adani Electricity Mumbai', vpa: 'adanipower.mum@sbi', mcc: '4900', cat: 'Utilities / Power', min: 1800, max: 3200, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Airtel Broadband Payment', vpa: 'airtel.bills@airtelbank', mcc: '4814', cat: 'Telecommunication', min: 999, max: 1499, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Uber Rides Mumbai', vpa: 'uber.india@icici', mcc: '4121', cat: 'Taxicabs & Rideshare', min: 180, max: 650, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Priya Verma (P2P Transfer)', vpa: 'priya.verma@okhdfcbank', mcc: '0000', cat: 'Peer-to-Peer Transfer', min: 500, max: 5000, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Amitabh Sen (Friend Split)', vpa: 'amitabh.sen@okaxis', mcc: '0000', cat: 'Peer-to-Peer Transfer', min: 300, max: 2500, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Decathlon Sports Andheri', vpa: 'decathlon.andheri@hdfcbank', mcc: '5941', cat: 'Sporting Goods', min: 1200, max: 4500, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
    { name: 'Apollo Pharmacy Bandra', vpa: 'apollopharmacy@axisbank', mcc: '5912', cat: 'Pharmacies & Drugs', min: 250, max: 1800, city: 'Mumbai', lat: 19.076, lon: 72.8777 },
  ];

  let currentTimestamp = baseTime;
  const normalDevice = 'OEM_ARM64_PIXEL8_VERIFIED';
  const normalIp = '103.21.124.8';

  // 1. Generate 236 Authentic Daily Transactions over 30 days (250 total with injected fraud scenarios)
  for (let i = 1; i <= 236; i++) {
    // Advance time by 2 to 6 hours
    currentTimestamp += (2 + (i % 4)) * 3600 * 1000 + (i * 12345 % 1800000);
    const m = authenticMerchants[i % authenticMerchants.length];
    const amount = Math.floor(m.min + (Math.sin(i) * 0.5 + 0.5) * (m.max - m.min));

    transactions.push({
      id: `TXN_2026_${String(i).padStart(4, '0')}`,
      timestamp: new Date(currentTimestamp).toISOString(),
      senderVpa,
      senderName,
      receiverVpa: m.vpa,
      receiverName: m.name,
      amount,
      currency: 'INR',
      channel: m.mcc === '0000' ? 'UPI_P2P' : 'UPI_P2M',
      mcc: m.mcc,
      mccCategory: m.cat,
      city: m.city,
      lat: m.lat,
      lon: m.lon,
      deviceFingerprint: normalDevice,
      ipAddress: normalIp
    });
  }

  // 2. Add Salary Credit (Legitimate high-value transfer)
  transactions.push({
    id: 'TXN_2026_SALARY_OCT',
    timestamp: new Date(baseTime + 15 * 24 * 3600 * 1000).toISOString(),
    senderVpa: 'razorpayx.payroll@hdfcbank',
    senderName: 'TechCorp India Pvt Ltd (Salary)',
    receiverVpa: senderVpa,
    receiverName: senderName,
    amount: 145000,
    currency: 'INR',
    channel: 'IMPS',
    mcc: '6012',
    mccCategory: 'Payroll / Financial Institution',
    city: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    deviceFingerprint: 'BANK_DIRECT_CLEARING_SWITCH',
    ipAddress: '14.143.45.12'
  });

  // 3. Inject Fraud Typology 1: Rapid High-Velocity Burst Attack (6 rapid transfers in 45 seconds)
  const burstBaseTime = Date.now() - 3 * 24 * 3600 * 1000 + 14 * 3600 * 1000;
  for (let b = 1; b <= 6; b++) {
    transactions.push({
      id: `TXN_BURST_ATTACK_${b}`,
      timestamp: new Date(burstBaseTime + b * 7000).toISOString(), // 7s apart
      senderVpa,
      senderName,
      receiverVpa: `unknown.merchant_${b}@paytm`,
      receiverName: `Automated Bot Node #${b}`,
      amount: 19500,
      currency: 'INR',
      channel: 'UPI_P2M',
      mcc: '5999',
      mccCategory: 'Miscellaneous Retail',
      city: 'Mumbai',
      lat: 19.076,
      lon: 72.8777,
      deviceFingerprint: 'ROOTED_GENYMOTION_EMULATOR_FAIL',
      ipAddress: '185.220.101.5' // Tor Exit Relay
    });
  }

  // 4. Inject Fraud Typology 2: Impossible Travel / Geo-Drift (10,800 km/h jump)
  const geoDriftTime = Date.now() - 2 * 24 * 3600 * 1000 + 19 * 3600 * 1000;
  // Local transaction in Mumbai at 7:00 PM
  transactions.push({
    id: 'TXN_GEODRIFT_BASE_MUMBAI',
    timestamp: new Date(geoDriftTime).toISOString(),
    senderVpa,
    senderName,
    receiverVpa: 'swiggy.orders@icici',
    receiverName: 'Swiggy Dinner Mumbai',
    amount: 620,
    currency: 'INR',
    channel: 'UPI_P2M',
    mcc: '5812',
    mccCategory: 'Online Food Delivery',
    city: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    deviceFingerprint: normalDevice,
    ipAddress: normalIp
  });
  // 15 minutes later, card used in London (7,200 km away!)
  transactions.push({
    id: 'TXN_GEODRIFT_ANOMALY_LONDON',
    timestamp: new Date(geoDriftTime + 15 * 60 * 1000).toISOString(),
    senderVpa,
    senderName,
    receiverVpa: 'harrods.luxury@barclays',
    receiverName: 'Harrods London Dept Store',
    amount: 88500,
    currency: 'INR',
    channel: 'NET_BANKING',
    mcc: '5311',
    mccCategory: 'Department Stores (International)',
    city: 'London',
    lat: 51.5074,
    lon: -0.1278,
    deviceFingerprint: 'LINUX_HEADLESS_CHROME_SPOOF',
    ipAddress: '82.165.197.1'
  });

  // 5. Inject Fraud Typology 3: High-Risk Online Gambling & Surcharge (MCC 7995)
  transactions.push({
    id: 'TXN_FRAUD_GAMBLING_MCC7995',
    timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(), // 2:00 AM
    senderVpa,
    senderName,
    receiverVpa: 'bet99.casino.cashout@upi',
    receiverName: 'Bet99 Offshore Gaming Corp',
    amount: 65000,
    currency: 'INR',
    channel: 'UPI_P2M',
    mcc: '7995',
    mccCategory: 'Online Gambling & Betting',
    city: 'Goa',
    lat: 15.2993,
    lon: 74.124,
    deviceFingerprint: 'EMULATOR_BLUESTACKS_MAC_CLONE',
    ipAddress: '104.244.42.1'
  });

  // 6. Inject Fraud Typology 4: Mule Account Syndicate Drain
  const muleDrainTime = Date.now() - 18 * 3600 * 1000;
  for (let m = 1; m <= 3; m++) {
    transactions.push({
      id: `TXN_MULE_DRAIN_${m}`,
      timestamp: new Date(muleDrainTime + m * 60000).toISOString(),
      senderVpa,
      senderName,
      receiverVpa: `mule.escrow.syndicate_${m}@ybl`,
      receiverName: `Syndicate Liquidation Mule #${m}`,
      amount: 49500,
      currency: 'INR',
      channel: 'UPI_P2P',
      mcc: '6011',
      mccCategory: 'Quasi-Cash / Financial Institution',
      city: 'Delhi',
      lat: 28.7041,
      lon: 77.1025,
      deviceFingerprint: 'ROOTED_ONEPLUS_OX_SPOOF',
      ipAddress: '185.100.87.2'
    });
  }

  // 7. Inject Fraud Typology 5: Suspicious Midnight Transfer (Needs Review)
  transactions.push({
    id: 'TXN_REVIEW_SUSPICIOUS_TRANSFER',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), // 3:30 AM
    senderVpa,
    senderName,
    receiverVpa: 'new.contact.unverified@sbi',
    receiverName: 'Rameshwar Yadav (First Time Recipient)',
    amount: 32000,
    currency: 'INR',
    channel: 'UPI_P2P',
    mcc: '0000',
    mccCategory: 'Peer-to-Peer Transfer',
    city: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    deviceFingerprint: normalDevice,
    ipAddress: normalIp
  });

  // Sort chronological order (oldest to newest)
  return transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
