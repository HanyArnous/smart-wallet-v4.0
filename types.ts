
export type TransactionType = 'EXPENSE' | 'INCOME';
export type AuditAction = 'ADD' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'RESET' | 'PAYOUT' | 'REDEEM' | 'COLLECT';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  targetType: string;
  targetName: string;
  details?: string;
}

export interface LifePillar {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
}

export interface SubCategory {
  id: string;
  pillarId: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: TransactionType;
  pillarId: string;
  subCategoryId?: string;
  isAuto: boolean;
  sourceId?: string; 
  sourceType?: 'RECEIVABLE' | 'INSTALLMENT' | 'CERTIFICATE';
  sourceMonth?: string; // الشهر المرتبط بالعملية (أو تاريخ دفعة الشهادة)
}

export interface PreciousMetal {
  id: 'GOLD' | 'SILVER';
  name: string;
  weight: number;
  karat?: number;
  currentPricePerGram: number;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  remainingMonths: number;
  totalMonths: number; 
  startDate: string;
  pillarId: string;
  subCategoryId?: string;
  paymentDay: number;
  lastPaymentDate?: string;
  paidMonths: string[]; // قائمة بالشهور المسددة بصيغة YYYY-MM
}

export interface Receivable {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  type: 'RENT' | 'OTHER';
  isCollectedThisMonth: boolean;
  pillarId: string;
  isRecurring: boolean;
  startDate: string;
  totalMonths?: number;
  remainingMonths?: number;
  endDate?: string;
  paidMonths: string[]; // قائمة بالشهور المحصلة بصيغة YYYY-MM
}

export interface BankCertificate {
  id: string;
  bankName: string;
  amount: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  payoutCycle: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  status: 'ACTIVE' | 'REDEEMED';
  lastPayoutDate?: string;
  pillarId: string; 
  paidPayouts: string[]; // قائمة بتواريخ الاستحقاق التي تم صرفها (ISO Date Strings)
}

export interface InvestmentSettings {
  enabled: boolean;
  thresholdPercentage: number;
  minDays: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
}

export interface AppState {
  transactions: Transaction[];
  pillars: LifePillar[];
  subCategories: SubCategory[];
  cashBalance: number;
  metals: PreciousMetal[];
  installments: Installment[];
  receivables: Receivable[];
  certificates: BankCertificate[];
  auditLogs: AuditEntry[]; 
  investmentSettings: InvestmentSettings;
  appPassword?: string;
}
