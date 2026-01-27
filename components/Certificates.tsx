
import React, { useState } from 'react';
import { BankCertificate, LifePillar } from '../types';

interface CertificatesProps {
  certificates: BankCertificate[];
  pillars: LifePillar[];
  onAdd: (c: Omit<BankCertificate, 'id' | 'paidPayouts'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (c: BankCertificate) => void;
  onPayout: (id: string, amount: number, dateKey: string) => void;
  onRedeem: (id: string, redemptionAmount: number) => void;
}

const Certificates: React.FC<CertificatesProps> = ({ certificates, pillars, onAdd, onDelete, onUpdate, onPayout, onRedeem }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState<string | null>(null);
  const [redemptionValue, setRedemptionValue] = useState<number>(0);
  const [editingCert, setEditingCert] = useState<BankCertificate | null>(null);
  const [form, setForm] = useState<Partial<BankCertificate>>({ payoutCycle: 'MONTHLY', pillarId: pillars[0]?.id || '4' });

  const handleSave = () => {
    if (!form.bankName || !form.amount || !form.interestRate || !form.pillarId) return;
    
    if (editingCert) {
      onUpdate({ ...editingCert, ...form } as BankCertificate);
    } else {
      onAdd({
        ...form,
        status: 'ACTIVE'
      } as Omit<BankCertificate, 'id' | 'paidPayouts'>);
    }
    setShowForm(false);
    setEditingCert(null);
    setForm({ payoutCycle: 'MONTHLY', pillarId: pillars[0]?.id || '4' });
  };

  const calculatePayoutAmount = (c: BankCertificate) => {
    const annualInterest = (c.amount * c.interestRate) / 100;
    switch(c.payoutCycle) {
      case 'MONTHLY': return annualInterest / 12;
      case 'QUARTERLY': return annualInterest / 4;
      case 'SEMI_ANNUALLY': return annualInterest / 2;
      case 'ANNUALLY': return annualInterest;
      default: return 0;
    }
  };

  const getPayoutDates = (c: BankCertificate) => {
    const dates: { key: string, label: string, date: Date }[] = [];
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    const current = new Date(start);
    
    // Move to first payout
    let monthsToAdd = 1;
    if (c.payoutCycle === 'QUARTERLY') monthsToAdd = 3;
    if (c.payoutCycle === 'SEMI_ANNUALLY') monthsToAdd = 6;
    if (c.payoutCycle === 'ANNUALLY') monthsToAdd = 12;

    current.setMonth(current.getMonth() + monthsToAdd);

    while (current <= end) {
      dates.push({
        key: current.toISOString(),
        date: new Date(current),
        label: current.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
      });
      current.setMonth(current.getMonth() + monthsToAdd);
    }
    return dates;
  };

  return (
    <div className="space-y-6 animate-fadeIn px-2 md:px-0">
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-right">
          <h2 className="text-2xl font-black">الشهادات والاستثمارات</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">إدارة العوائد والتحصيل الدوري</p>
        </div>
        <button onClick={() => { setEditingCert(null); setForm({ payoutCycle: 'MONTHLY', pillarId: pillars[0]?.id || '4', startDate: new Date().toISOString().split('T')[0] }); setShowForm(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all">
          + ربط شهادة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        {certificates.map(c => {
          const isRedeemed = c.status === 'REDEEMED';
          const payoutAmount = calculatePayoutAmount(c);
          const dates = getPayoutDates(c);
          const totalPayouts = dates.length;
          const paidCount = (c.paidPayouts || []).length;
          const progress = totalPayouts > 0 ? (paidCount / totalPayouts) * 100 : 0;
          const linkedPillar = pillars.find(p => p.id === c.pillarId);

          const nextUnpaid = dates.find(d => !(c.paidPayouts || []).includes(d.key));

          return (
            <div key={c.id} className={`bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group transition-all text-right ${isRedeemed ? 'opacity-50 grayscale' : 'hover:shadow-2xl hover:shadow-indigo-50'}`}>
              
              <div className="flex flex-col md:flex-row-reverse justify-between items-start mb-6 relative z-10 gap-4">
                <div className="flex-1">
                  <h4 className="font-black text-slate-800 text-xl mb-1">{c.bankName}</h4>
                  <div className="flex gap-2 items-center justify-end flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase">{c.payoutCycle === 'MONTHLY' ? 'شهري' : c.payoutCycle === 'QUARTERLY' ? 'ربع سنوي' : 'سنوي'}</span>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">عائد {c.interestRate}%</span>
                    {linkedPillar && <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase">{linkedPillar.icon} {linkedPillar.name}</span>}
                  </div>
                </div>
                {!isRedeemed && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCert(c); setForm(c); setShowForm(true); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-300 hover:text-indigo-500 transition-colors">✏️</button>
                    <button onClick={() => { if(window.confirm('حذف الشهادة نهائياً؟')) onDelete(c.id); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row-reverse gap-8 mb-8 relative z-10">
                 <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">أصل الشهادة</span>
                    <div className="text-4xl font-black text-slate-900 tabular-nums">
                      {c.amount.toLocaleString()} <small className="text-sm font-bold text-slate-300">ج.م</small>
                    </div>
                 </div>
                 <div className="flex-1 md:text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">قيمة العائد الدوري</span>
                    <div className="text-2xl font-black text-emerald-500 tabular-nums">
                      {Math.round(payoutAmount).toLocaleString()} <small className="text-xs font-bold text-emerald-300">ج.م</small>
                    </div>
                 </div>
              </div>

              {!isRedeemed && (
                <div className="space-y-6 relative z-10 pt-6 border-t border-slate-50">
                   {/* Payout Grid */}
                   <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                     <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">جدول صرف العوائد</h5>
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {dates.map((d, i) => {
                           const isPaid = (c.paidPayouts || []).includes(d.key);
                           const isNext = nextUnpaid?.key === d.key;
                           return (
                             <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[8px] font-black transition-all ${
                               isPaid 
                                 ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' 
                                 : isNext
                                    ? 'bg-white border-indigo-200 text-indigo-600 ring-2 ring-indigo-100'
                                    : 'bg-white border-slate-200 text-slate-300'
                             }`}>
                                <span className="opacity-80">{d.label}</span>
                                {isPaid && <span>✓</span>}
                             </div>
                           );
                        })}
                     </div>
                   </div>

                   <div className="flex flex-col md:flex-row gap-3">
                      <button 
                         disabled={!nextUnpaid}
                         onClick={() => {
                            if (nextUnpaid) onPayout(c.id, payoutAmount, nextUnpaid.key);
                         }}
                         className={`flex-1 py-4 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                           nextUnpaid 
                             ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' 
                             : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                         }`}
                      >
                         {nextUnpaid ? `تحصيل عائد ${nextUnpaid.label}` : 'تم تحصيل كافة العوائد 🎉'}
                      </button>

                      <button 
                          onClick={() => { 
                             setRedemptionValue(c.amount);
                             setShowRedeemModal(c.id);
                          }}
                          className="px-6 bg-rose-50 text-rose-500 font-black py-4 rounded-2xl hover:bg-rose-100 transition-all text-xs"
                       >
                          استرداد
                       </button>
                   </div>
                </div>
              )}
              {isRedeemed && (
                <div className="text-center py-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="text-xs font-black text-slate-400">تم استرداد هذه الشهادة وإغلاقها</span>
                </div>
              )}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-30 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* مودال الاسترداد المطور */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 animate-bounceIn shadow-2xl text-right">
            <span className="text-4xl block mb-4">⚠️</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">تأكيد كسر الشهادة</h3>
            <p className="text-xs text-slate-500 font-bold mb-6">برجاء إدخال القيمة الاستردادية الفعلية التي سيتم إضافتها لحسابك (بعد خصم عمولات البنك إن وجدت):</p>
            
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">القيمة الاستردادية (ج.م)</label>
              <input 
                type="number" 
                value={redemptionValue} 
                onChange={e => setRedemptionValue(Number(e.target.value))}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-2xl text-indigo-600 text-left"
              />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                   onRedeem(showRedeemModal, redemptionValue);
                   setShowRedeemModal(null);
                }}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-lg"
              >
                تأكيد الاسترداد النهائي
              </button>
              <button onClick={() => setShowRedeemModal(null)} className="w-full text-slate-400 font-bold text-xs uppercase py-2">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 animate-bounceIn shadow-2xl text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingCert ? 'تعديل الشهادة' : 'ربط شهادة استثمار'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 text-xl w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">✕</button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">البنك / الوعاء الاستثماري</label>
                <input value={form.bankName || ''} placeholder="مثال: البنك الأهلي..." className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm text-right" onChange={e => setForm({...form, bankName: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 text-right">المبلغ (الأصل)</label>
                  <input type="number" value={form.amount || ''} placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm text-left" onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 text-right">الفائدة %</label>
                  <input type="number" value={form.interestRate || ''} placeholder="20" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm text-indigo-600 text-left" onChange={e => setForm({...form, interestRate: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 text-right">تاريخ البداية</label>
                  <input type="date" value={form.startDate || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[10px] text-left" onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1 text-right">تاريخ الانتهاء</label>
                  <input type="date" value={form.endDate || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[10px] text-rose-500 text-left" onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">دورة صرف العائد</label>
                  <select value={form.payoutCycle} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-xs text-right" onChange={e => setForm({...form, payoutCycle: e.target.value as any})}>
                    <option value="MONTHLY">شهري</option>
                    <option value="QUARTERLY">كل 3 شهور</option>
                    <option value="SEMI_ANNUALLY">كل 6 شهور</option>
                    <option value="ANNUALLY">سنوي</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-1">الركيزة المرتبطة</label>
                  <select value={form.pillarId} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-xs text-right" onChange={e => setForm({...form, pillarId: e.target.value})}>
                    {pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-indigo-700 transition-all text-lg">تأكيد وربط الشهادة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
