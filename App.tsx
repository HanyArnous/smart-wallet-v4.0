import { NativeBiometric } from 'capacitor-native-biometric'; 
import { StatusBar } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Transaction, 
  AppState,
  AppNotification,
  Receivable,
  BankCertificate,
  Installment,
  AuditEntry,
  AuditAction
} from './types';
import { 
  INITIAL_PILLARS, 
  INITIAL_SUB_CATEGORIES, 
  INITIAL_METALS 
} from './constants';
import { storageService } from './services/storageService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import AssetManager from './components/AssetManager';
import Planning from './components/Planning';
import Analytics from './components/Analytics';
import SMSParser from './components/SMSParser';
import Settings from './components/Settings';
import Receivables from './components/Receivables';
import Certificates from './components/Certificates';
import ContactUs from './components/ContactUs';
import AuthOverlay from './components/AuthOverlay';
import NotificationToast from './components/NotificationToast';
import ActivityHistory from './components/ActivityHistory';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const isAuthenticatingRef = useRef(false);
  const lastPauseTimeRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<number | null>(null);
  
  const [state, setState] = useState<AppState>(() => {
    const loaded = storageService.loadState();
    if (loaded) return loaded;
    
    return {
      transactions: [],
      pillars: INITIAL_PILLARS,
      subCategories: INITIAL_SUB_CATEGORIES,
      cashBalance: 0,
      metals: INITIAL_METALS,
      installments: [],
      receivables: [],
      certificates: [],
      auditLogs: [],
      investmentSettings: { enabled: true, thresholdPercentage: 50, minDays: 30 },
      appPassword: ''
    };
  });

  const enableFullScreen = async () => {
    try { await StatusBar.hide(); } catch (e) { console.warn(e); }
  };

  const performBiometricAuth = useCallback(async () => { // <--- التأكد من وجود async هنا
    if (isAuthenticatingRef.current || isBiometricVerified) return;
    
    try {
      isAuthenticatingRef.current = true;
      
      const result = await NativeBiometric.isAvailable();
      
      if (result.isAvailable) {
        await new Promise(r => setTimeout(r, 600));
        
        await NativeBiometric.verifyIdentity({
          reason: "تأكيد الهوية للوصول للمحفظة",
          title: "دخول آمن",
          subtitle: "استخدم البصمة، الوجه، أو رمز القفل",
          description: "حماية بياناتك وأصولك المالية",
          useFallback: true, 
        });
        
        setIsBiometricVerified(true);
      } else {
        setIsBiometricVerified(true);
      }
    } catch (error) {
      console.error("Authentication failed", error);
      setIsBiometricVerified(false);
    } finally {
      setTimeout(() => { isAuthenticatingRef.current = false; }, 1000);
    }
  }, [isBiometricVerified]);

  useEffect(() => {
    performBiometricAuth();
    const statusListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        lastPauseTimeRef.current = Date.now();
      } else {
        const timeSpentOutside = Date.now() - lastPauseTimeRef.current;
        if (timeSpentOutside > 30000 && !isAuthenticatingRef.current) {
          setIsBiometricVerified(false);
          setTimeout(() => performBiometricAuth(), 500);
        }
      }
    });
    return () => { statusListener.remove(); };
  }, [performBiometricAuth]);

  useEffect(() => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      storageService.saveState(state);
    }, 1000);
  }, [state]);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'] = 'success') => {
    const id = Math.random().toString();
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const createLog = (action: AuditAction, type: string, name: string, details?: string): AuditEntry => ({
    id: (Date.now() + Math.random()).toString(),
    timestamp: new Date().toISOString(),
    action,
    targetType: type,
    targetName: name,
    details
  });

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>, silent: boolean = false) => {
    const newTxId = Date.now().toString();
    const newTx = { ...t, id: newTxId };
    const logEntry = createLog('ADD', 'معاملة', t.description, `بقيمة ${t.amount} ج.م`);

    setState(prev => {
      const amount = Number(t.amount);
      const newBalance = t.type === 'INCOME' ? prev.cashBalance + amount : prev.cashBalance - amount;
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        cashBalance: newBalance,
        auditLogs: [logEntry, ...prev.auditLogs].slice(0, 500)
      };
    });

    if (!silent) addNotification('تم التسجيل', `تمت إضافة ${t.description} بنجاح.`, 'success');
  }, [addNotification]);

  const updateTransaction = useCallback((tx: Transaction) => {
    setState(prev => {
      const oldTx = prev.transactions.find(t => t.id === tx.id);
      if (!oldTx) return prev;

      let tempBalance = prev.cashBalance;
      tempBalance = oldTx.type === 'INCOME' ? tempBalance - Number(oldTx.amount) : tempBalance + Number(oldTx.amount);
      tempBalance = tx.type === 'INCOME' ? tempBalance + Number(tx.amount) : tempBalance - Number(tx.amount);

      const log = createLog('UPDATE', 'معاملة', tx.description, `تعديل من ${oldTx.amount} إلى ${tx.amount}`);
      return {
        ...prev,
        transactions: prev.transactions.map(t => t.id === tx.id ? tx : t),
        cashBalance: tempBalance,
        auditLogs: [log, ...prev.auditLogs].slice(0, 500)
      };
    });
    addNotification('تم التحديث', 'تم تعديل بيانات المعاملة والرصيد.', 'info');
  }, [addNotification]);

  const deleteTransaction = useCallback((id: string) => {
    const t = state.transactions.find(tx => tx.id === id);
    if (!t) return;

    setState(prev => {
      const newBalance = t.type === 'INCOME' ? prev.cashBalance - Number(t.amount) : prev.cashBalance + Number(t.amount);
      const log = createLog('DELETE', 'معاملة', t.description, `تراجع عن العملية (Rollback)`);

      let updatedReceivables = prev.receivables;
      let updatedInstallments = prev.installments;
      let updatedCertificates = prev.certificates;

      if (t.sourceType === 'RECEIVABLE' && t.sourceId) {
        updatedReceivables = prev.receivables.map(r => 
          r.id === t.sourceId ? { 
            ...r, 
            isCollectedThisMonth: false, 
            paidMonths: r.paidMonths.filter(m => m !== t.sourceMonth),
            remainingMonths: r.remainingMonths !== undefined ? r.remainingMonths + 1 : r.remainingMonths 
          } : r
        );
      } 
      else if (t.sourceType === 'INSTALLMENT' && t.sourceId) {
        updatedInstallments = prev.installments.map(i => 
          i.id === t.sourceId ? { 
            ...i, 
            remainingMonths: i.remainingMonths + 1,
            paidMonths: i.paidMonths.filter(m => m !== t.sourceMonth)
          } : i
        );
      } 
      else if (t.sourceType === 'CERTIFICATE' && t.sourceId) {
        updatedCertificates = prev.certificates.map(c => 
          c.id === t.sourceId ? { 
             ...c, 
             paidPayouts: t.description.includes('عائد') && t.sourceMonth 
                ? c.paidPayouts.filter(date => date !== t.sourceMonth) 
                : c.paidPayouts,
             status: t.description.includes('استرداد') ? 'ACTIVE' : c.status
          } : c
        );
      }

      return {
        ...prev,
        transactions: prev.transactions.filter(tx => tx.id !== id),
        cashBalance: newBalance,
        receivables: updatedReceivables,
        installments: updatedInstallments,
        certificates: updatedCertificates,
        auditLogs: [log, ...prev.auditLogs].slice(0, 500)
      };
    });
    addNotification('تم حذف العملية', 'تم التراجع عن العملية المالية وتصحيح حالة الأصول.', 'warning');
  }, [state.transactions, addNotification]);

  const handlePayInstallment = useCallback((id: string, monthKey: string) => {
    const i = state.installments.find(item => item.id === id);
    if (!i || i.remainingMonths <= 0 || i.paidMonths.includes(monthKey)) return;

    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('ar-EG', { month: 'long' });

    const newTx: Omit<Transaction, 'id'> = {
      amount: i.monthlyAmount,
      description: `سداد قسط: ${i.name} (${monthName})`,
      date: new Date().toISOString(),
      type: 'EXPENSE',
      pillarId: i.pillarId,
      subCategoryId: i.subCategoryId,
      isAuto: true,
      sourceId: id,
      sourceType: 'INSTALLMENT',
      sourceMonth: monthKey
    };

    setState(prev => ({
      ...prev,
      installments: prev.installments.map(item => 
        item.id === id ? { 
          ...item, 
          remainingMonths: item.remainingMonths - 1, 
          lastPaymentDate: new Date().toISOString(),
          paidMonths: [...item.paidMonths, monthKey]
        } : item
      )
    }));
    addTransaction(newTx, true);
    addNotification('تم السداد', `تم سداد قسط ${i.name} لشهر ${monthName}.`, 'success');
  }, [state.installments, addTransaction, addNotification]);

  const handleCollectReceivable = useCallback((id: string, monthKey?: string) => {
    const r = state.receivables.find(item => item.id === id);
    if (!r || (monthKey && r.paidMonths.includes(monthKey))) return;

    let monthName = '';
    if (monthKey) {
      const [year, month] = monthKey.split('-');
      monthName = ` (${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('ar-EG', { month: 'long' })})`;
    }

    const currentActualMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const effectiveMonthKey = monthKey || currentActualMonth;

    const newTx: Omit<Transaction, 'id'> = {
      amount: r.amount,
      description: `تحصيل: ${r.name}${monthName}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      pillarId: r.pillarId,
      isAuto: true,
      sourceId: id,
      sourceType: 'RECEIVABLE',
      sourceMonth: effectiveMonthKey
    };

    setState(prev => ({
      ...prev,
      receivables: prev.receivables.map(item => {
        if (item.id === id) {
          const nextRemaining = item.remainingMonths ? item.remainingMonths - 1 : undefined;
          return { 
            ...item, 
            isCollectedThisMonth: item.isRecurring 
              ? [...item.paidMonths, effectiveMonthKey].includes(currentActualMonth)
              : true,
            remainingMonths: nextRemaining,
            paidMonths: [...item.paidMonths, effectiveMonthKey]
          };
        }
        return item;
      })
    }));
    addTransaction(newTx, true);
    addNotification('تم التحصيل', `تم إضافة مبلغ ${r.name}${monthName} للرصيد.`, 'success');
  }, [state.receivables, addTransaction, addNotification]);

  const handleUpdateReceivable = useCallback((receivable: Receivable) => {
    const log = createLog('UPDATE', 'مستحق', receivable.name, `تعديل البيانات الأساسية`);
    setState(prev => ({
      ...prev,
      receivables: prev.receivables.map(r => r.id === receivable.id ? receivable : r),
      auditLogs: [log, ...prev.auditLogs].slice(0, 500)
    }));
    addNotification('تم التحديث', `تم حفظ تعديلات ${receivable.name} بنجاح.`, 'info');
  }, [addNotification]);

  const handleDeleteReceivable = useCallback((id: string) => {
    const item = state.receivables.find(r => r.id === id);
    if (!item) return;

    const log = createLog('DELETE', 'مستحق', item.name, `حذف نهائي للمستحق`);
    setState(prev => ({
      ...prev,
      receivables: prev.receivables.filter(r => r.id !== id),
      auditLogs: [log, ...prev.auditLogs].slice(0, 500)
    }));
    addNotification('تم الحذف', `تم إزالة ${item.name} من النظام.`, 'warning');
  }, [state.receivables, addNotification]);

  const handlePayoutCertificate = useCallback((id: string, amount: number, payoutDateKey: string) => {
    const c = state.certificates.find(item => item.id === id);
    if (!c || c.status === 'REDEEMED' || c.paidPayouts.includes(payoutDateKey)) return;

    const dateObj = new Date(payoutDateKey);
    const dateLabel = dateObj.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

    const newTx: Omit<Transaction, 'id'> = {
      amount,
      description: `عائد شهادة: ${c.bankName} (${dateLabel})`,
      date: new Date().toISOString(),
      type: 'INCOME',
      pillarId: c.pillarId,
      isAuto: true,
      sourceId: id,
      sourceType: 'CERTIFICATE',
      sourceMonth: payoutDateKey 
    };

    const log = createLog('PAYOUT', 'شهادة', c.bankName, `تحصيل عائد بقيمة ${amount} ج.م`);

    setState(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { 
          ...item, 
          paidPayouts: [...item.paidPayouts, payoutDateKey],
          lastPayoutDate: new Date().toISOString() 
        } : item
      ),
      auditLogs: [log, ...prev.auditLogs].slice(0, 500)
    }));
    addTransaction(newTx, true);
    addNotification('تم تحصيل العائد', `تم إضافة عائد ${c.bankName} للرصيد.`, 'success');
  }, [state.certificates, addTransaction, addNotification]);

  const handleUpdateCertificate = useCallback((cert: BankCertificate) => {
    const log = createLog('UPDATE', 'شهادة', cert.bankName, `تعديل بيانات الشهادة`);
    setState(prev => ({
      ...prev,
      certificates: prev.certificates.map(c => c.id === cert.id ? cert : c),
      auditLogs: [log, ...prev.auditLogs].slice(0, 500)
    }));
    addNotification('تم التحديث', `تم حفظ تعديلات ${cert.bankName}.`, 'info');
  }, [addNotification]);

  const handleRedeemCertificate = useCallback((id: string, redemptionAmount: number) => {
    const c = state.certificates.find(item => item.id === id);
    if (!c || c.status === 'REDEEMED') return;

    const newTx: Omit<Transaction, 'id'> = {
      amount: redemptionAmount,
      description: `استرداد شهادة: ${c.bankName}`,
      date: new Date().toISOString(),
      type: 'INCOME',
      pillarId: c.pillarId,
      isAuto: true,
      sourceId: id,
      sourceType: 'CERTIFICATE'
    };

    const log = createLog('REDEEM', 'شهادة', c.bankName, `استرداد أصل بقيمة ${redemptionAmount} ج.م`);

    setState(prev => ({
      ...prev,
      certificates: prev.certificates.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'REDEEMED',
        } : item
      ),
      auditLogs: [log, ...prev.auditLogs].slice(0, 500)
    }));
    addTransaction(newTx, true);
    addNotification('تم الاسترداد', `تم كسر شهادة ${c.bankName} وإضافة المبلغ للرصيد.`, 'success');
  }, [state.certificates, addTransaction, addNotification]);

  const handleReset = useCallback((options: { 
    transactions: boolean; 
    installments: boolean; 
    receivables: boolean; 
    certificates: boolean; 
    metals: boolean; 
    settings: boolean;
  }) => {
    const log = createLog('RESET', 'نظام', 'تصفير مخصص', 'تم حذف بيانات محددة من النظام');
    
    setState(prev => {
      let newState = { ...prev };
      
      if (options.transactions) {
        newState.transactions = [];
        newState.cashBalance = 0;
      }
      if (options.installments) { newState.installments = []; }
      if (options.receivables) { newState.receivables = []; }
      if (options.certificates) { newState.certificates = []; }
      if (options.metals) { newState.metals = prev.metals.map(m => ({ ...m, weight: 0 })); }
      if (options.settings) {
        newState.appPassword = '';
        newState.investmentSettings = { enabled: true, thresholdPercentage: 50, minDays: 30 };
        newState.pillars = INITIAL_PILLARS;
        newState.subCategories = INITIAL_SUB_CATEGORIES;
      }

      newState.auditLogs = [log];
      return newState;
    });

    addNotification('تم التصفير', 'تم حذف البيانات المحددة بنجاح.', 'info');
  }, [addNotification]);

  const totalWealth = useMemo(() => {
    const metalWealth = state.metals.reduce((acc, m) => acc + (Number(m.weight) * Number(m.currentPricePerGram)), 0);
    const certWealth = state.certificates.filter(c => c.status === 'ACTIVE').reduce((acc, c) => acc + Number(c.amount), 0);
    return Number(state.cashBalance) + metalWealth + certWealth;
  }, [state.cashBalance, state.metals, state.certificates]);

  if (!isAuthenticated) return (
    <AuthOverlay 
      onAuthenticated={() => setIsAuthenticated(true)} 
      savedPassword={state.appPassword} 
    />
  );

  if (!isBiometricVerified) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white font-['Cairo']">
       <div className="bg-slate-800 p-10 rounded-[3rem] shadow-2xl text-center border border-slate-700">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🔒</div>
          <h2 className="text-xl font-black mb-6">المحفظة مؤمنة</h2>
          <button 
            onClick={performBiometricAuth}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-bold active:scale-95 transition-all"
          >
            فتح بالبصمة
          </button>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Cairo'] text-slate-900 select-none pt-[calc(env(safe-area-inset-top)+10px)]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="fixed top-[env(safe-area-inset-top)] right-6 z-[200] space-y-3 pointer-events-none w-[calc(100%-3rem)] md:w-80">
        {notifications.map(notif => <NotificationToast key={notif.id} notification={notif} />)}
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-4">
          <div className="text-right w-full md:w-auto">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">المحفظة الذكية</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">الإصدار النهائي المستقر v4.5</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-row-reverse">
             <div className="bg-white flex-1 p-3 px-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-black uppercase">السيولة</span>
                <span className="text-lg font-black text-indigo-600 tabular-nums">{state.cashBalance.toLocaleString()} <small className="text-[10px]">ج.م</small></span>
             </div>
             <div className="bg-slate-900 flex-1 p-3 px-6 rounded-2xl shadow-xl flex flex-col items-center">
                <span className="text-[9px] text-indigo-300 font-black uppercase">الثروة</span>
                <span className="text-lg font-black text-white">{totalWealth.toLocaleString()} <small className="text-[10px]">ج.م</small></span>
             </div>
          </div>
        </header>

        <div className="pb-32">
          {activeTab === 'dashboard' && (
            <Dashboard state={state} totalWealth={totalWealth} onAddTransaction={addTransaction} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TransactionsList 
                  transactions={state.transactions} 
                  pillars={state.pillars} 
                  subCategories={state.subCategories} 
                  onDelete={deleteTransaction} 
                  onUpdate={updateTransaction} 
                />
              </div>
              <SMSParser pillars={state.pillars} onAddTransaction={addTransaction} />
            </div>
          )}
          {activeTab === 'receivables' && (
            <Receivables 
              receivables={state.receivables} 
              pillars={state.pillars}
              onAdd={(r)=>{
                const log = createLog('ADD', 'مستحق', r.name, `بمبلغ ${r.amount} ج.م`);
                setState(prev=>({...prev, receivables: [...prev.receivables, {...r, id: Date.now().toString(), isCollectedThisMonth: false, paidMonths: []}], auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                addNotification('تمت الإضافة', `تم تسجيل مستحق ${r.name} بنجاح.`, 'success');
              }} 
              onCollect={handleCollectReceivable} 
              onDelete={handleDeleteReceivable} 
              onUpdate={handleUpdateReceivable}
            />
          )}
          {activeTab === 'certificates' && (
            <Certificates 
              certificates={state.certificates} 
              pillars={state.pillars}
              onAdd={(c)=>{
                const log = createLog('ADD', 'شهادة', c.bankName, `بقيمة ${c.amount} ج.م`);
                setState(prev=>({...prev, certificates: [...prev.certificates, {...c, id: Date.now().toString(), status: 'ACTIVE', paidPayouts: []}], auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                addNotification('تم الربط', 'تم تسجيل الشهادة البنكية الجديدة.', 'success');
              }} 
              onDelete={(id)=>{
                const item = state.certificates.find(c=>c.id===id);
                if(item) {
                  const log = createLog('DELETE', 'شهادة', item.bankName);
                  setState(prev=>({...prev, certificates: prev.certificates.filter(c=>c.id!==id), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                  addNotification('تم الحذف', 'تم حذف الشهادة نهائياً.', 'warning');
                }
              }} 
              onUpdate={handleUpdateCertificate}
              onPayout={handlePayoutCertificate}
              onRedeem={handleRedeemCertificate}
            />
          )}
          {activeTab === 'assets' && (
            <AssetManager 
              metals={state.metals} 
              onUpdate={(id, w, p) => {
                const metal = state.metals.find(m=>m.id===id);
                const log = createLog('UPDATE', 'معادن', metal?.name || id, `وزن ${w}جم بسعر ${p}ج.م`);
                setState(prev => ({...prev, metals: prev.metals.map(m => m.id === id ? {...m, weight: w, currentPricePerGram: p} : m), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                addNotification('تحديث الأصول', 'تم تحديث أوزان وأسعار المعادن.', 'info');
              }} 
            />
          )}
          {activeTab === 'planning' && (
            <Planning 
              installments={state.installments} 
              pillars={state.pillars} 
              subCategories={state.subCategories} 
              onAdd={(i) => {
                const log = createLog('ADD', 'قسط', i.name, `شهري ${i.monthlyAmount}`);
                setState(prev => ({...prev, installments: [...prev.installments, {...i, id: Date.now().toString(), paidMonths: []}], auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                addNotification('تم الجدولة', `تم تسجيل قسط ${i.name}.`, 'success');
              }} 
              onDelete={(id) => {
                const item = state.installments.find(i=>i.id===id);
                if(item) {
                  const log = createLog('DELETE', 'قسط', item.name);
                  setState(prev => ({...prev, installments: prev.installments.filter(ins => ins.id !== id), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                  addNotification('تم الحذف', 'تم حذف الالتزام من الجدولة.', 'info');
                }
              }} 
              onPay={handlePayInstallment}
              onUpdate={(inst) => {
                const log = createLog('UPDATE', 'قسط', inst.name);
                setState(prev => ({...prev, installments: prev.installments.map(i=>i.id===inst.id?inst:i), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}));
                addNotification('تم التحديث', 'تم حفظ التعديلات في القسط.', 'info');
              }}
            />
          )}
          {activeTab === 'audit' && <ActivityHistory logs={state.auditLogs} />}
          {activeTab === 'analytics' && <Analytics state={state} />}
          {activeTab === 'settings' && (
            <Settings 
              state={state}
              onUpdateBudget={(id, amt)=>{
                const pName = state.pillars.find(p=>p.id===id)?.name || id;
                const log = createLog('UPDATE', 'ميزانية', pName, `إلى ${amt}`);
                setState(prev=>({...prev, pillars: prev.pillars.map(p=>p.id===id?{...p, budget: amt}:p), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
              }} 
              onAddSubCategory={(pid, n)=>{
                const log = createLog('ADD', 'بند فرعي', n);
                setState(prev=>({...prev, subCategories: [...prev.subCategories, {id: Date.now().toString(), pillarId: pid, name: n}], auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
              }} 
              onDeleteSubCategory={(id)=>{
                const sub = state.subCategories.find(s=>s.id===id);
                if(sub) {
                  const log = createLog('DELETE', 'بند فرعي', sub.name);
                  setState(prev=>({...prev, subCategories: prev.subCategories.filter(s=>s.id!==id), auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
                }
              }} 
              onUpdateInvestmentSettings={(settings)=>{
                const log = createLog('UPDATE', 'إعدادات', 'الاستثمار');
                setState(prev=>({...prev, investmentSettings: settings, auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
              }}
              onUpdatePassword={(pw)=>{
                const log = createLog('UPDATE', 'أمان', 'كلمة المرور');
                setState(prev=>({...prev, appPassword: pw, auditLogs: [log, ...prev.auditLogs].slice(0, 500)}))
              }}
              onExport={storageService.exportData} 
              onImport={(f)=>{
                storageService.importData(f).then(data=>{
                  const log = createLog('IMPORT', 'بيانات', 'نظام');
                  setState({...data, auditLogs: [log, ...data.auditLogs].slice(0, 500)});
                  addNotification('تم الاستعادة', 'تم تحميل البيانات بنجاح.', 'success');
                })
              }} 
              onReset={handleReset} 
            />
          )}
          {activeTab === 'contact' && <ContactUs />}
        </div>
        
        <footer className="mt-20 py-10 border-t border-slate-100 text-center space-y-2 opacity-50">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Smart Wallet Enterprise Edition</p>
           <p className="text-[9px] font-bold text-slate-300">Version 4.5.2 (Stable Release) • Built for Private Privacy</p>
        </footer>
      </main>
    </div>
  );
};

export default App;