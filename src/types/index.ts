export type ChannelType = 'UPI_P2P' | 'UPI_P2M' | 'IMPS' | 'NET_BANKING';

export type Verdict = 'SAFE' | 'SUSPICIOUS' | 'FRAUD';

export interface StatementTransaction {
  id: string;
  timestamp: string;
  senderVpa: string;
  senderName: string;
  receiverVpa: string;
  receiverName: string;
  amount: number;
  currency: 'INR';
  channel: ChannelType;
  mcc: string;
  mccCategory: string;
  city: string;
  lat: number;
  lon: number;
  deviceFingerprint: string;
  ipAddress: string;
}

export interface RuleCheck {
  ruleId: string;
  ruleName: string;
  category: 'VELOCITY' | 'GEO_DRIFT' | 'AMOUNT_MCC' | 'MULE_PATTERN' | 'DEVICE_INTEGRITY';
  triggered: boolean;
  score: number;
  threshold: string;
  actualValue: string;
  explanation: string;
}

export interface EvaluationResult {
  transaction: StatementTransaction;
  verdict: Verdict;
  riskScore: number; // 0 to 100
  latencyMs: number;
  primaryReason: string;
  ruleChecks: RuleCheck[];
  evaluatedAt: string;
}

export interface StatementStats {
  totalCount: number;
  totalAmount: number;
  fraudCount: number;
  suspiciousCount: number;
  safeCount: number;
  amountAtRisk: number;
  avgLatencyMs: number;
}
