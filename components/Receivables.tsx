
import React, { useState } from 'react';
import { Receivable, LifePillar } from '../types';

interface ReceivablesProps {
  receivables: Receivable[];
  pillars: LifePillar[];
  onAdd: (r: Omit<Receivable, 'id' | 'isCollectedThisMonth'>) => void;
  onCollect: (id: string, monthKey?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (receivable: Receivable) => void;
}

const Receivables: React.FC<ReceivablesProps> = ({ receivables, pillars, onAdd, onCollect, onDelete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Receivable | null>(null);
  const [form, setForm] = useState<Partial<Receivable>>({ 
    type: 'RENT', 
    dueDay: 1, 
    pillarId: pillars[0]?.id,
    isRecurring: true,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [isLimited, setIsLimited] = useState(false);

  const totalMonthlyReceivables = receivables.reduce((acc, r) => acc + (r.isRecurring ? r.amount : 0), 0);
  const totalOutstanding = receivables.reduce((acc, r) => {
    if (r.remainingMonths) return acc + (r.amount * r.remainingMonths);
    if (!r.isRecurring && !r.isCollectedThisMonth) return acc + r.amount;
    return acc;
  }, 0);

  const getMonthList = (startDate: string, totalMonths?: number) => {
    if (!totalMonths) return [];
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

  const handleSave = () => {
    if (editingItem) {
      onUpdate(editingItem);
      setEditingItem(null);
      setShowForm(false);
      return;
    }

    if (!form.name || !form.amount || !form.pillarId) return;

    let endDate = undefined;
    if (form.isRecurring && isLimited && form.totalMonths && form.startDate) {
      const date = new Date(form.startDate);
      date.setMonth(date.getMonth() + (form.totalMonths - 1));
      endDate = date.toISOString().split('T')[0];
    }

    onAdd({
      ...form,
      isRecurring: !!form.isRecurring,
      remainingMonths: (form.isRecurring && isLimited) ? form.totalMonths : undefined,
      totalMonths: (form.isRecurring && isLimited) ? form.totalMonths : undefined,
      endDate: endDate,
      paidMonths: []
    } as any);
    
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ type: 'RENT', dueDay: 1, pillarId: pillars[0]?.id, isRecurring: true, startDate: new Date().toISOString().split('T')[0] });
    setIsLimited(false);
    setEditingItem(null);
  };

  const startEdit = (r: Receivable) => {
    setEditingItem(r);
    setIsLimited(r.totalMonths !== undefined);
    setShowForm(true);
  };

  return (
    <div className="space-y-10 animate-fadeIn text-right pb-24">
      {/* Header Section */}
      <div className="bg-indigo-600 p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 text-center md:text-right">
          <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">إدارة المستحقات الذكية</h2>
          <p className="text-indigo-100 font-medium text-xs md:text-base opacity-80">تحصيل الإيجارات والديون المجدولة بالشهور.</p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/20 text-center w-full sm:w-auto">
            <span className="text-[10px] text-indigo-200 font-black block mb-1 uppercase tracking-widest">إجمالي المديونات المنتظرة</span>
            <span className="text-2xl md:text-4xl font-black text-white tabular-nums">
              {totalOutstanding.toLocaleString()} <small className="text-sm font-bold">ج.م</small>
            </span>
          </div>
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="w-full sm:w-auto bg-white text-indigo-600 font-black px-12 py-5 rounded-[2.5rem] hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <span>📥</span> تسجيل مستحق جديد
          </button>
        </div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Receivables List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {receivables.length === 0 ? (
          <div className="lg:col-span-2 py-40 text-center text-slate-300 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
             <div className="text-[100px] mb-6 opacity-20">🏠</div>
             <p className="text-2xl font-black text-slate-400">لا توجد مستحقات مسجلة حالياً</p>
          </div>
        ) : (
          receivables.map(r => {
            const pillar = pillars.find(p => p.id === r.pillarId);
            const isLimitedItem = r.isRecurring && r.totalMonths !== undefined;
            const months = isLimitedItem ? getMonthList(r.startDate, r.totalMonths) : [];
            const isDone = isLimitedItem && r.remainingMonths !== undefined && r.remainingMonths <= 0;
            const progress = isLimitedItem ? ((r.totalMonths! - r.remainingMonths!) / r.totalMonths!) * 100 : 0;
            
            const nextMonth = months.find(m => !r.paidMonths.includes(m.key));

            return (
              <div key={r.id} className={`bg-white p-8 rounded-[3.5rem] border border-slate-100 group transition-all relative overflow-hidden flex flex-col ${isDone ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:shadow-indigo-50'}`}>
                
                <div className="flex justify-between items-start mb-6 flex-row-reverse">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white bg-slate-50">
                      {r.type === 'RENT' ? '🏠' : '💰'}
                    </div>
                    <div className="text-right">
                      <h4 className="font-black text-slate-900 text-xl mb-1">{r.name}</h4>
                      <div className="flex gap-2 justify-end">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${r.isRecurring ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                          {r.isRecurring ? 'دخل متكرر' : 'لمرة واحدة'}
                        </span>
                        {r.isRecurring && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">يوم {r.dueDay}</span>}
                        {pillar && <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{pillar.icon} {pillar.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(r)} 
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-full"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        if(window.confirm(`هل أنت متأكد من حذف "${r.name}" نهائياً من النظام؟`)) {
                          onDelete(r.id);
                        }
                      }} 
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 rounded-full group/del"
                      title="حذف"
                    >
                      <span className="group-hover/del:scale-125 inline-block transition-transform">🗑️</span>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                   <div className="flex justify-between items-end mb-4 flex-row-reverse">
                     <div className="text-right">
                        <span className="text-3xl font-black text-slate-900 tabular-nums">{r.amount.toLocaleString()}</span>
                        <small className="text-[10px] font-bold text-slate-400 mr-1">ج.م</small>
                     </div>
                     <div className="text-left text-[10px] font-black text-slate-400 uppercase">
                        {isLimitedItem ? (isDone ? 'مكتمل' : `متبقي ${r.remainingMonths} شهر`) : 'تحصيل فوري'}
                     </div>
                   </div>
                   {isLimitedItem && (
                     <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${progress}%` }} />
                     </div>
                   )}
                </div>

                {/* شبكة الشهور للمتكرر فقط */}
                {isLimitedItem && (
                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex-1 mb-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">تتبع التحصيل بالشهور</h5>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {months.map(m => {
                        const isPaid = r.paidMonths.includes(m.key);
                        return (
                          <div 
                            key={m.key} 
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[8px] font-black transition-all ${
                              isPaid ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-105' : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <span className="opacity-70">{m.label.split(' ')[1]}</span>
                            <span className="text-[9px]">{m.label.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  {!isDone && (
                    <button 
                      onClick={() => onCollect(r.id, r.isRecurring && isLimitedItem ? nextMonth?.key : undefined)}
                      disabled={r.isCollectedThisMonth && !r.isRecurring}
                      className={`w-full font-black py-4 rounded-[1.5rem] shadow-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 ${
                        (r.isCollectedThisMonth && !r.isRecurring) 
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {r.isRecurring && isLimitedItem 
                        ? (nextMonth ? `📥 تحصيل شهر ${nextMonth.label}` : 'تم تحصيل كافة الشهور ✓') 
                        : (r.isCollectedThisMonth ? 'تم التحصيل ✓' : '📥 تحصيل المبلغ الآن')}
                    </button>
                  )}
                  {isDone && (
                    <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-[1.5rem] text-center font-black text-xs border border-slate-200">
                      تم استيفاء كامل المستحق (مكتمل)
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl animate-bounceIn text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingItem ? 'تعديل المستحق' : 'إضافة مستحق جديد'}</h2>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-slate-400 hover:text-slate-900 text-xl w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center transition-all">✕</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block px-2">وصف المستحق</label>
                <input 
                  placeholder="مثال: إيجار الشقة، قسط سلفة..." 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:ring-4 focus:ring-indigo-500/10"
                  value={editingItem ? editingItem.name : (form.name || '')}
                  onChange={e => editingItem ? setEditingItem({...editingItem, name: e.target.value}) : setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block text-right px-2">المبلغ (ج.م)</label>
                  <input 
                    type="number" placeholder="0.00" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none"
                    value={editingItem ? editingItem.amount : (form.amount || '')}
                    onChange={e => editingItem ? setEditingItem({...editingItem, amount: parseFloat(e.target.value)}) : setForm({...form, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block text-right px-2">
                    {(editingItem ? editingItem.isRecurring : form.isRecurring) ? 'يوم الاستحقاق' : 'تاريخ الاستحقاق'}
                  </label>
                  {(editingItem ? editingItem.isRecurring : form.isRecurring) ? (
                    <input 
                      type="number" min="1" max="31" placeholder="1" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center outline-none"
                      value={editingItem ? editingItem.dueDay : (form.dueDay || 1)}
                      onChange={e => editingItem ? setEditingItem({...editingItem, dueDay: parseInt(e.target.value)}) : setForm({...form, dueDay: parseInt(e.target.value)})}
                    />
                  ) : (
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-[10px] text-left outline-none"
                      value={editingItem ? editingItem.startDate.split('T')[0] : (form.startDate || '')}
                      onChange={e => editingItem ? setEditingItem({...editingItem, startDate: e.target.value}) : setForm({...form, startDate: e.target.value})}
                    />
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-100">
                <div className="flex items-center justify-between flex-row-reverse">
                   <div className="text-right">
                     <span className="text-xs font-black text-slate-700 block">دخل متكرر بالشهور</span>
                     <span className="text-[9px] text-slate-400 font-bold">يسمح بتتبع التحصيل في جدول زمني</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingItem ? editingItem.isRecurring : form.isRecurring} 
                        onChange={e => editingItem ? setEditingItem({...editingItem, isRecurring: e.target.checked}) : setForm({...form, isRecurring: e.target.checked})} 
                        className="sr-only peer" 
                      />
                      <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                   </label>
                </div>

                {(editingItem ? editingItem.isRecurring : form.isRecurring) && (
                  <>
                    <div className="flex items-center justify-between flex-row-reverse pt-2 border-t border-black/5">
                       <span className="text-xs font-black text-slate-700">محدد بمدة (شهور)</span>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isLimited} onChange={e => setIsLimited(e.target.checked)} className="sr-only peer" />
                          <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                       </label>
                    </div>
                    {isLimited && (
                      <div className="animate-slideInRight grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase mb-1 block text-right">عدد الشهور</label>
                          <input 
                            type="number" placeholder="مثلاً: 12" 
                            className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none font-black text-indigo-600 text-center"
                            value={editingItem ? editingItem.totalMonths : (form.totalMonths || '')}
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              if (editingItem) {
                                setEditingItem({
                                  ...editingItem, 
                                  totalMonths: val, 
                                  remainingMonths: val - editingItem.paidMonths.length
                                });
                              } else {
                                setForm({...form, totalMonths: val});
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-indigo-400 uppercase mb-1 block text-right">تاريخ البدء</label>
                          <input 
                            type="date"
                            className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none font-bold text-[10px] text-left"
                            value={editingItem ? editingItem.startDate.split('T')[0] : (form.startDate || '')}
                            onChange={e => editingItem ? setEditingItem({...editingItem, startDate: e.target.value}) : setForm({...form, startDate: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 pr-2">الركيزة التابعة</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs text-right"
                  value={editingItem ? editingItem.pillarId : form.pillarId}
                  onChange={e => editingItem ? setEditingItem({...editingItem, pillarId: e.target.value}) : setForm({...form, pillarId: e.target.value})}
                >
                  {pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-lg"
                >
                  {editingItem ? 'حفظ التعديلات النهائية' : 'تأكيد وإضافة المستحق'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receivables;
