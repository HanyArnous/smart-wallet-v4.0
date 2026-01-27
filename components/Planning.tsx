
import React, { useState, useMemo } from 'react';
import { Installment, LifePillar, SubCategory } from '../types';

interface PlanningProps {
  installments: Installment[];
  pillars: LifePillar[];
  subCategories: SubCategory[];
  onAdd: (inst: Omit<Installment, 'id' | 'paidMonths'>) => void;
  onDelete: (id: string) => void;
  onPay: (id: string, monthKey: string) => void;
  onUpdate: (inst: Installment) => void;
}

const Planning: React.FC<PlanningProps> = ({ installments, pillars, subCategories, onAdd, onDelete, onPay, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);
  const [newInst, setNewInst] = useState<Partial<Installment>>({
    pillarId: pillars[0]?.id,
    remainingMonths: 12,
    totalMonths: 12,
    paymentDay: 1,
    startDate: new Date().toISOString().split('T')[0]
  });

  const availableSubs = subCategories.filter(s => s.pillarId === (editingInst ? editingInst.pillarId : newInst.pillarId));

  const getMonthList = (startDate: string, totalMonths: number) => {
    const list = [];
    const start = new Date(startDate);
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('ar-EG', { month: 'short', year: '2-digit' });
      list.push({ key, label });
    }
    return list;
  };

  const handleSubmit = () => {
    const form = editingInst || newInst;
    if (form.name && form.monthlyAmount && form.pillarId && form.paymentDay) {
      if (editingInst) {
        onUpdate(editingInst);
        setEditingInst(null);
      } else {
        const totalMonths = form.totalMonths || form.remainingMonths || 1;
        onAdd({
          name: form.name,
          totalAmount: (form.monthlyAmount * totalMonths),
          monthlyAmount: form.monthlyAmount,
          remainingMonths: form.remainingMonths || 1,
          totalMonths: totalMonths,
          startDate: form.startDate || new Date().toISOString(),
          pillarId: form.pillarId,
          subCategoryId: form.subCategoryId,
          paymentDay: form.paymentDay
        });
      }
      setShowForm(false);
      setNewInst({ pillarId: pillars[0]?.id, remainingMonths: 12, totalMonths: 12, paymentDay: 1, startDate: new Date().toISOString().split('T')[0] });
    }
  };

  const totalMonthlyCommitment = installments.reduce((acc, i) => acc + i.monthlyAmount, 0);
  const today = new Date().getDate();

  return (
    <div className="space-y-10 animate-fadeIn text-right">
      {/* Header Section */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 text-center lg:text-right">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">إدارة الأقساط المتقدمة</h2>
          <p className="text-slate-500 font-medium text-xs md:text-base">تتبع الشهور المسددة وجدولة التزاماتك بدقة زمنية.</p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="bg-rose-50 px-8 py-5 rounded-[2rem] border border-rose-100 text-center shadow-inner group w-full sm:w-auto">
            <span className="text-[10px] text-rose-400 font-black block mb-1 uppercase tracking-widest">إجمالي السحب الشهري</span>
            <span className="text-2xl md:text-4xl font-black text-rose-600 leading-none">
              {totalMonthlyCommitment.toLocaleString()} <small className="text-sm font-bold">ج.م</small>
            </span>
          </div>
          <button 
            onClick={() => { setEditingInst(null); setShowForm(true); }}
            className="w-full sm:w-auto bg-indigo-600 text-white font-black px-12 py-5 rounded-[2rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
          >
            <span>🗓️</span> جدولة قسط جديد
          </button>
        </div>
      </div>

      {/* Installment Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {installments.length === 0 ? (
          <div className="lg:col-span-2 py-40 text-center text-slate-300 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
             <div className="text-[100px] mb-6 opacity-20">📅</div>
             <p className="text-2xl font-black text-slate-400">لا توجد أقساط مجدولة حالياً</p>
          </div>
        ) : (
          installments.map(inst => {
            const pillar = pillars.find(p => p.id === inst.pillarId);
            const months = getMonthList(inst.startDate, inst.totalMonths);
            const isCompleted = inst.remainingMonths <= 0;
            const progress = ((inst.totalMonths - inst.remainingMonths) / inst.totalMonths) * 100;
            
            // تحديد الشهر التالي المستحق
            const nextUnpaid = months.find(m => !inst.paidMonths.includes(m.key));

            return (
              <div key={inst.id} className={`bg-white p-8 rounded-[3rem] border border-slate-100 group transition-all relative overflow-hidden flex flex-col ${isCompleted ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:shadow-indigo-50'}`}>
                
                <div className="flex justify-between items-start mb-6 flex-row-reverse">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm bg-slate-50 border border-white" style={{ color: pillar?.color }}>
                      {pillar?.icon || '📦'}
                    </div>
                    <div className="text-right">
                      <h4 className="font-black text-slate-900 text-xl mb-1">{inst.name}</h4>
                      <div className="flex gap-2 justify-end">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{pillar?.name}</span>
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">كل يوم {inst.paymentDay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingInst(inst); setShowForm(true); }} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">✏️</button>
                    <button onClick={() => { if(window.confirm('حذف القسط نهائياً؟')) onDelete(inst.id); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                  </div>
                </div>

                <div className="mb-6">
                   <div className="flex justify-between items-end mb-4 flex-row-reverse">
                     <div className="text-right">
                        <span className="text-3xl font-black text-slate-900 tabular-nums">{inst.monthlyAmount.toLocaleString()}</span>
                        <small className="text-[10px] font-bold text-slate-400 mr-1">ج.م / شهرياً</small>
                     </div>
                     <div className="text-left text-[10px] font-black text-slate-400 uppercase">
                        {isCompleted ? 'مكتمل' : `متبقي ${inst.remainingMonths} شهر`}
                     </div>
                   </div>
                   <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${progress}%` }} />
                   </div>
                </div>

                {/* شبكة الشهور */}
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex-1 mb-6">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">سجل سداد الشهور</h5>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {months.map(m => {
                      const isPaid = inst.paidMonths.includes(m.key);
                      return (
                        <div 
                          key={m.key} 
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[8px] font-black transition-all ${
                            isPaid ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <span className="opacity-70">{m.label.split(' ')[1]}</span>
                          <span className="text-[9px]">{m.label.split(' ')[0]}</span>
                          {isPaid && <span className="mt-1">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isCompleted && nextUnpaid && (
                  <button 
                    onClick={() => onPay(inst.id, nextUnpaid.key)}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    ⚡ سداد قسط شهر {nextUnpaid.label}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4 text-right">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl animate-bounceIn max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <h2 className="text-2xl font-black text-slate-900">{editingInst ? 'تعديل بيانات القسط' : 'جدولة التزام جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 text-2xl w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center transition-all">✕</button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">مسمى القسط</label>
                <input 
                  placeholder="مثال: قسط البنك، قرض السيارة..." 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:ring-4 focus:ring-indigo-500/10"
                  value={editingInst ? editingInst.name : (newInst.name || '')}
                  onChange={e => editingInst ? setEditingInst({...editingInst, name: e.target.value}) : setNewInst({...newInst, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">القسط الشهري</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none"
                    value={editingInst ? editingInst.monthlyAmount : (newInst.monthlyAmount || '')}
                    onChange={e => editingInst ? setEditingInst({...editingInst, monthlyAmount: e.target.valueAsNumber}) : setNewInst({...newInst, monthlyAmount: e.target.valueAsNumber})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">يوم السداد (1-31)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center outline-none"
                    value={editingInst ? editingInst.paymentDay : (newInst.paymentDay || 1)}
                    onChange={e => editingInst ? setEditingInst({...editingInst, paymentDay: e.target.valueAsNumber}) : setNewInst({...newInst, paymentDay: e.target.valueAsNumber})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">إجمالي الشهور</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none"
                    value={editingInst ? editingInst.totalMonths : (newInst.totalMonths || 12)}
                    onChange={e => editingInst ? setEditingInst({...editingInst, totalMonths: e.target.valueAsNumber, remainingMonths: e.target.valueAsNumber - editingInst.paidMonths.length}) : setNewInst({...newInst, totalMonths: e.target.valueAsNumber, remainingMonths: e.target.valueAsNumber})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">تاريخ البدء</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-[10px] text-left outline-none"
                    value={editingInst ? editingInst.startDate.split('T')[0] : (newInst.startDate || '')}
                    onChange={e => editingInst ? setEditingInst({...editingInst, startDate: e.target.value}) : setNewInst({...newInst, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">الركيزة</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-right outline-none"
                    value={editingInst ? editingInst.pillarId : newInst.pillarId}
                    onChange={e => editingInst ? setEditingInst({...editingInst, pillarId: e.target.value, subCategoryId: undefined}) : setNewInst({...newInst, pillarId: e.target.value, subCategoryId: undefined})}
                  >
                    {pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">البند الفرعي</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-right outline-none"
                    value={editingInst ? (editingInst.subCategoryId || '') : (newInst.subCategoryId || '')}
                    onChange={e => editingInst ? setEditingInst({...editingInst, subCategoryId: e.target.value}) : setNewInst({...newInst, subCategoryId: e.target.value})}
                  >
                    <option value="">-- اختر البند --</option>
                    {availableSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSubmit} 
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-lg"
                >
                  {editingInst ? 'تحديث البيانات' : 'حفظ الالتزام'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
