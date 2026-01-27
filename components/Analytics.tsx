
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AnalyticsProps {
  state: AppState;
}

const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  const [dateRange, setDateRange] = useState<'30D' | '90D' | 'YEAR' | 'ALL'>('30D');
  const [filterType, setFilterType] = useState<'ALL' | 'PILLAR' | 'SUB'>('ALL');
  const [selectedPillar, setSelectedPillar] = useState<string>(state.pillars[0]?.id || '');
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 320 });
  const pieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pieRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerSize({ width: entries[0].contentRect.width, height: 320 });
      }
    });
    observer.observe(pieRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return state.transactions.filter(t => {
      const txDate = new Date(t.date);
      let inRange = true;
      if (dateRange === '30D') inRange = (now.getTime() - txDate.getTime()) <= 30 * 86400000;
      else if (dateRange === '90D') inRange = (now.getTime() - txDate.getTime()) <= 90 * 86400000;
      else if (dateRange === 'YEAR') inRange = txDate.getFullYear() === now.getFullYear();
      
      if (!inRange) return false;

      if (filterType === 'PILLAR') return String(t.pillarId) === String(selectedPillar);
      if (filterType === 'SUB') return String(t.subCategoryId) === String(selectedSub);
      
      return true;
    });
  }, [state.transactions, dateRange, filterType, selectedPillar, selectedSub]);

  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + Number(b.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + Number(b.amount), 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const pieData = useMemo(() => {
    if (filterType === 'ALL') {
      return state.pillars.map(p => ({
        name: p.name,
        value: state.transactions
          .filter(t => String(t.pillarId) === String(p.id) && t.type === 'EXPENSE')
          .reduce((a, b) => a + Number(b.amount), 0),
        color: p.color
      })).filter(d => d.value > 0);
    } else if (filterType === 'PILLAR') {
      const currentPillar = state.pillars.find(p => String(p.id) === String(selectedPillar));
      const subs = state.subCategories.filter(s => String(s.pillarId) === String(selectedPillar));
      
      // حساب المصاريف لكل بند فرعي
      const subData = subs.map(s => ({
        name: s.name,
        value: filteredTransactions
          .filter(t => String(t.subCategoryId) === String(s.id) && t.type === 'EXPENSE')
          .reduce((a, b) => a + Number(b.amount), 0),
        color: currentPillar?.color || '#6366f1'
      })).filter(d => d.value > 0);

      // حساب المصاريف المسجلة على الركيزة بدون بند فرعي
      const generalValue = filteredTransactions
        .filter(t => (!t.subCategoryId || t.subCategoryId === '') && t.type === 'EXPENSE')
        .reduce((a, b) => a + Number(b.amount), 0);
        
      if (generalValue > 0) {
        subData.push({
          name: 'مصاريف عامة (غير مصنفة فرعياً)',
          value: generalValue,
          color: '#cbd5e1'
        });
      }
      return subData;
    }
    return [];
  }, [state.transactions, state.pillars, state.subCategories, filterType, selectedPillar, filteredTransactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6 md:space-y-10 animate-fadeIn pb-24 px-1 md:px-0 text-right">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-4">
          <div className="text-center md:text-right">
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">تحليلات الربط والبنود الفرعية</h2>
            <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black mt-1">تتبع دقيق لكافة مستويات الإنفاق</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl shadow-inner w-full md:w-auto overflow-x-auto flex-row-reverse">
            {(['30D', '90D', 'YEAR', 'ALL'] as const).map(range => (
              <button key={range} onClick={() => setDateRange(range)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${dateRange === range ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                {range === '30D' ? '30 يوم' : range === '90D' ? '90 يوم' : range === 'YEAR' ? 'هذا العام' : 'الكل'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50 flex-row-reverse">
           <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 pr-2 text-right">نطاق التصفية</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xs outline-none border border-transparent focus:border-indigo-100 transition-all text-right">
                <option value="ALL">كافة الركائز (بند رئيسي)</option>
                <option value="PILLAR">تحليل ركيزة (بنود فرعية)</option>
                <option value="SUB">بند فرعي محدد</option>
              </select>
           </div>
           {filterType === 'PILLAR' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 pr-2 text-right">اختر الركيزة</label>
                <select value={selectedPillar} onChange={e => setSelectedPillar(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xs outline-none border-transparent focus:border-indigo-100 transition-all text-right">
                  {state.pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
              </div>
           )}
           {filterType === 'SUB' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 pr-2 text-right">اختر البند الفرعي</label>
                <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xs outline-none border-transparent focus:border-indigo-100 transition-all text-right">
                  {state.subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-row-reverse">
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm text-center">
           <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">الإيرادات</span>
           <p className="text-2xl font-black text-emerald-500 tabular-nums">{summary.income.toLocaleString()} <small className="text-[10px]">ج.م</small></p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm text-center">
           <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">المصروفات</span>
           <p className="text-2xl font-black text-rose-500 tabular-nums">{summary.expense.toLocaleString()} <small className="text-[10px]">ج.م</small></p>
        </div>
        <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl text-center transition-all ${summary.net >= 0 ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-rose-600 text-white shadow-rose-100'}`}>
           <span className="text-[10px] font-black opacity-60 uppercase block mb-1">الرصيد الصافي</span>
           <p className="text-2xl font-black tabular-nums">{summary.net.toLocaleString()} <small className="text-[10px]">ج.م</small></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-w-0 flex flex-col items-center" ref={pieRef}>
           <h3 className="text-lg font-black mb-6 w-full text-right">
             {filterType === 'PILLAR' ? 'توزيع البنود الفرعية' : 'توزيع الركائز الرئيسية'}
           </h3>
           <div className="h-[320px] w-full relative">
             {containerSize.width > 0 && pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height={320}>
                 <PieChart>
                   <Pie data={pieData} innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value">
                     {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', fontFamily: 'Cairo', fontSize: '11px', textAlign: 'right', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '15px', direction: 'rtl' }} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-300 font-bold text-xs text-center p-10">
                 <span className="text-4xl mb-2 opacity-20">📊</span>
                 {pieData.length === 0 ? 'لا توجد مصروفات مسجلة في هذا النطاق.' : 'جاري معالجة البيانات...'}
               </div>
             )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-w-0">
           <div className="flex justify-between items-center mb-6 flex-row-reverse">
             <h3 className="text-lg font-black text-slate-800">سجل الحركات المفصل</h3>
             <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full">الربط المالي</span>
           </div>
           <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {filteredTransactions.slice(0, 50).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all group flex-row-reverse">
                   <div className="flex flex-col text-right">
                      <span className="font-black text-xs text-slate-700 group-hover:text-indigo-600 transition-colors">{tx.description}</span>
                      <span className="text-[9px] text-slate-400 font-bold tabular-nums">
                        {new Date(tx.date).toLocaleDateString('ar-EG')} - {new Date(tx.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                   <div className="text-left flex flex-col items-start">
                      <p className={`font-black text-xs tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{Number(tx.amount).toLocaleString()} ج.م
                      </p>
                      <div className="flex gap-1 mt-1 flex-row-reverse">
                        <span className="text-[8px] bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-400 font-black uppercase">
                          {state.pillars.find(p => p.id === tx.pillarId)?.name || 'عام'}
                        </span>
                        {tx.subCategoryId && (
                          <span className="text-[8px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-50 text-indigo-400 font-black uppercase">
                            {state.subCategories.find(s => s.id === tx.subCategoryId)?.name || 'بند'}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
              ))}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-20 text-slate-300 font-bold text-sm">
                  لا توجد حركات مسجلة حالياً.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
