
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, Transaction, Installment, Receivable } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService';

interface DashboardProps {
  state: AppState;
  totalWealth: number;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, totalWealth, onAddTransaction, setActiveTab }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('جاري تحليل بياناتك المالية...');
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 350 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    pillarId: state.pillars[0]?.id || '1',
    subCategoryId: '',
    date: new Date().toISOString()
  });

  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerSize({ width: entries[0].contentRect.width, height: 350 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const upcomingEvents = useMemo(() => {
    const events: any[] = [];
    
    // الأقساط
    state.installments.forEach(i => {
      if (i.remainingMonths > 0) {
        const lastPaid = i.lastPaymentDate ? new Date(i.lastPaymentDate) : null;
        const isPaidThisMonth = lastPaid && 
                               lastPaid.getMonth() === currentMonth && 
                               lastPaid.getFullYear() === currentYear;

        if (!isPaidThisMonth) {
          const diff = i.paymentDay - today;
          // إظهار إذا كان متأخر أو استحقاقه خلال 7 أيام
          if (diff <= 7) {
            events.push({ 
              id: `inst-${i.id}`, 
              name: i.name, 
              amount: i.monthlyAmount, 
              type: 'OUT', 
              day: i.paymentDay, 
              target: 'planning',
              isLate: diff < 0,
              isToday: diff === 0,
              paidCount: i.totalMonths - i.remainingMonths,
              totalCount: i.totalMonths,
              category: 'قسط'
            });
          }
        }
      }
    });

    // المستحقات (إيجار / ديون)
    state.receivables.forEach(r => {
      if (!r.isCollectedThisMonth) {
        const diff = r.dueDay - today;
        if (diff <= 7) {
          events.push({ 
            id: `rec-${r.id}`, 
            name: r.name, 
            amount: r.amount, 
            type: 'IN', 
            day: r.dueDay, 
            target: 'receivables',
            isLate: diff < 0,
            isToday: diff === 0,
            paidCount: r.totalMonths && r.remainingMonths !== undefined ? (r.totalMonths - r.remainingMonths) : undefined,
            totalCount: r.totalMonths,
            category: r.type === 'RENT' ? 'إيجار' : 'مستحق'
          });
        }
      }
    });

    return events.sort((a, b) => {
      // ترتيب المتأخر أولاً، ثم حسب اليوم
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;
      return a.day - b.day;
    });
  }, [state.installments, state.receivables, today, currentMonth, currentYear]);

  const imminentOutflow = upcomingEvents.filter(e => e.type === 'OUT').reduce((a, b) => a + b.amount, 0);

  useEffect(() => {
    const fetchAdvice = async () => {
      if (state.transactions.length === 0) {
        setAiAdvice('ابدأ بتسجيل معاملاتك للحصول على نصيحة ذكية.');
        setLoadingAdvice(false);
        return;
      }
      setLoadingAdvice(true);
      const advice = await getFinancialAdvice(`السيولة: ${state.cashBalance}, الثروة: ${totalWealth}`);
      setAiAdvice(advice);
      setLoadingAdvice(false);
    };
    fetchAdvice();
  }, [state.cashBalance, totalWealth]);

  const combinedChartData = useMemo(() => {
    const data = state.pillars.map(p => {
      const expenses = state.transactions
        .filter(t => String(t.pillarId) === String(p.id) && t.type === 'EXPENSE')
        .reduce((a, b) => a + Number(b.amount), 0);
      
      const incomes = state.transactions
        .filter(t => String(t.pillarId) === String(p.id) && t.type === 'INCOME')
        .reduce((a, b) => a + Number(b.amount), 0);
      
      const assets = state.certificates
        .filter(c => String(c.pillarId) === String(p.id) && c.status === 'ACTIVE')
        .reduce((a, b) => a + Number(b.amount), 0);

      return {
        name: p.name,
        'مصروف': expenses,
        'إيراد': incomes,
        'أصول': assets
      };
    });

    const metalsValue = state.metals.reduce((acc, m) => acc + (Number(m.weight) * Number(m.currentPricePerGram)), 0);
    if (metalsValue > 0) {
      data.push({
        name: 'المعادن',
        'مصروف': 0,
        'إيراد': 0,
        'أصول': metalsValue
      });
    }

    return data;
  }, [state.pillars, state.transactions, state.certificates, state.metals]);

  const availableSubCategories = useMemo(() => {
    return state.subCategories.filter(s => String(s.pillarId) === String(newTx.pillarId));
  }, [state.subCategories, newTx.pillarId]);

  return (
    <div className="space-y-8 pb-24 px-2 md:px-0 animate-fadeIn text-right">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group text-right flex flex-col justify-between h-48"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 flex items-center justify-end gap-2">
              إضافة عملية جديدة <span className="text-2xl">➕</span>
            </h3>
            <p className="text-indigo-100 text-[10px] font-bold opacity-80 uppercase tracking-widest">تحديث الرصيد والبنود الفرعية</p>
          </div>
          <div className="mt-8 flex items-center justify-end gap-2 relative z-10">
            <div className="bg-white/20 px-6 py-3 rounded-2xl text-xs font-black backdrop-blur-md group-hover:bg-white group-hover:text-indigo-600 transition-all">اضغط هنا للبدء</div>
          </div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
        </button>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center relative overflow-hidden h-48">
           <div className="flex items-start gap-4 relative z-10 flex-row-reverse text-right">
             <span className="text-3xl">🤖</span>
             <div className="flex-1">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">المستشار الذكي</span>
                <p className="text-sm font-bold leading-relaxed">{loadingAdvice ? 'جاري التحليل...' : aiAdvice}</p>
             </div>
           </div>
           <div className="absolute bottom-0 left-0 p-4 text-4xl opacity-5">🧠</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[9px] font-black uppercase mb-1">السيولة المتاحة</p>
          <p className="text-2xl font-black text-indigo-600 tabular-nums">{state.cashBalance.toLocaleString()} <small className="text-[10px]">ج.م</small></p>
        </div>
        
        <button onClick={() => setActiveTab('receivables')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
          <p className="text-slate-400 text-[9px] font-black uppercase mb-1 group-hover:text-emerald-600">دخل منتظر 🔗</p>
          <p className="text-2xl font-black text-emerald-500 tabular-nums">+{state.receivables.filter(r => !r.isCollectedThisMonth).reduce((a,b)=>a+b.amount,0).toLocaleString()}</p>
        </button>

        <button onClick={() => setActiveTab('planning')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all group">
          <p className="text-slate-400 text-[9px] font-black uppercase mb-1 group-hover:text-rose-600">سداد وشيك 🔗</p>
          <p className="text-2xl font-black text-rose-500 tabular-nums">-{imminentOutflow.toLocaleString()}</p>
        </button>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-right">
          <p className="text-slate-400 text-[9px] font-black uppercase mb-1">صافي الثروة</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{totalWealth.toLocaleString()} <small className="text-[10px]">ج.م</small></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
           <h3 className="text-lg font-black flex items-center justify-end gap-3 mb-6">
              الجدول الوشيك <span className="text-indigo-500">⏰</span>
           </h3>
           <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-24 text-slate-300">
                  <span className="text-4xl block mb-2 opacity-20">📅</span>
                  <p className="font-bold text-xs uppercase tracking-tighter">لا توجد مواعيد قريبة</p>
                </div>
              ) : (
                upcomingEvents.map(event => (
                  <button 
                    key={event.id} 
                    onClick={() => setActiveTab(event.target)} 
                    className={`w-full flex flex-col p-5 rounded-3xl border transition-all group relative overflow-hidden ${
                      event.isLate 
                        ? 'bg-rose-50 border-rose-200 shadow-sm shadow-rose-50' 
                        : event.isToday 
                          ? 'bg-indigo-50 border-indigo-200 shadow-md animate-pulse' 
                          : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100'
                    }`}
                  >
                     <div className="flex items-center justify-between w-full mb-3 flex-row-reverse">
                        <div className="flex items-center gap-3 text-right flex-row-reverse">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                             event.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                           }`}>
                              {event.type === 'IN' ? '📥' : '📤'}
                           </div>
                           <div className="text-right">
                              <div className="flex items-center gap-2 flex-row-reverse">
                                 <p className={`font-black text-sm ${event.isLate ? 'text-rose-800' : 'text-slate-800'} group-hover:text-indigo-600 transition-colors`}>
                                   {event.name}
                                 </p>
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg ${
                                   event.isLate ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'
                                 }`}>
                                   {event.category}
                                 </span>
                              </div>
                              <p className={`text-[9px] font-black uppercase tracking-tight flex items-center gap-1 flex-row-reverse mt-0.5 ${
                                event.isLate ? 'text-rose-500' : event.isToday ? 'text-indigo-600' : 'text-slate-400'
                              }`}>
                                 {event.isLate ? '⚠️ متأخر منذ أيام' : event.isToday ? '🎯 استحقاق اليوم' : `منتظر يوم ${event.day}`}
                              </p>
                           </div>
                        </div>
                        <div className="text-left">
                           <p className={`font-black text-sm tabular-nums ${event.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {event.type === 'IN' ? '+' : '-'}{event.amount.toLocaleString()} <small className="text-[9px]">ج.م</small>
                           </p>
                        </div>
                     </div>

                     {/* عرض الشهور المسددة */}
                     {event.totalCount !== undefined && (
                        <div className="w-full mt-2 pt-3 border-t border-black/5">
                           <div className="flex justify-between items-center text-[9px] font-black mb-1.5 flex-row-reverse">
                              <span className={event.isLate ? 'text-rose-600' : 'text-slate-500'}>
                                 الحالة: {event.paidCount} من أصل {event.totalCount} شهر
                              </span>
                              <span className="text-slate-400">
                                 {Math.round((event.paidCount / event.totalCount) * 100)}% مُنجز
                              </span>
                           </div>
                           <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div 
                                 className={`h-full transition-all duration-700 ${
                                   event.isLate ? 'bg-rose-500' : 'bg-indigo-500'
                                 }`} 
                                 style={{ width: `${(event.paidCount / event.totalCount) * 100}%` }}
                              />
                           </div>
                        </div>
                     )}

                     {event.isLate && (
                       <div className="absolute top-0 right-0 p-1">
                          <div className="bg-rose-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-tighter">متأخر</div>
                       </div>
                     )}
                  </button>
                ))
              )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-w-0 flex flex-col">
           <div className="flex justify-between items-center mb-8 flex-row-reverse">
             <h3 className="text-lg font-black flex items-center gap-2">
               <span className="text-indigo-500">📊</span> ميزان القوى المالية (خطوط)
             </h3>
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">تكامل الركائز والأصول</span>
           </div>
           
           <div className="flex-1 w-full relative min-h-[350px]" ref={containerRef}>
             {containerSize.width > 0 ? (
               <ResponsiveContainer width="100%" height={350}>
                 <LineChart data={combinedChartData} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                   <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '20px', border: 'none', fontFamily: 'Cairo', textAlign: 'right', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} 
                   />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '900', direction: 'rtl', paddingTop: '20px' }} />
                   <Line type="monotone" dataKey="إيراد" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                   <Line type="monotone" dataKey="مصروف" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                   <Line type="monotone" dataKey="أصول" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest">
                 جاري معالجة البيانات...
               </div>
             )}
           </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[400] flex items-center justify-center p-4 text-right">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-bounceIn overflow-y-auto max-h-[95vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <h2 className="text-2xl font-black text-slate-900">عملية سريعة</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-xl w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-6">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase pr-2">المبلغ</label>
                 <input type="number" placeholder="0.00" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none text-3xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-left tabular-nums"
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.valueAsNumber })} />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase pr-2">بيان العملية</label>
                 <input type="text" placeholder="سوبر ماركت، بنزين..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right"
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block">الركيزة (رئيسي)</label>
                   <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-xs text-right"
                    value={newTx.pillarId}
                    onChange={(e) => setNewTx({ ...newTx, pillarId: e.target.value, subCategoryId: '' })}>
                    {state.pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block">نوع العملية</label>
                   <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-xs text-right"
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value as any })}>
                    <option value="EXPENSE">مصروف</option>
                    <option value="INCOME">إيداع / إيراد</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block">البند الفرعي (اختياري)</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none text-xs text-right"
                  value={newTx.subCategoryId || ''}
                  onChange={(e) => setNewTx({ ...newTx, subCategoryId: e.target.value })}
                >
                  <option value="">-- بدون تصنيف فرعي --</option>
                  {availableSubCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button 
                onClick={() => { 
                  if(newTx.amount && newTx.description) {
                    onAddTransaction({...newTx, date: new Date().toISOString()} as any);
                    setShowAddModal(false);
                  }
                }} 
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-lg"
              >
                تأكيد التسجيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
