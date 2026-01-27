
import React, { useState, useMemo } from 'react';
import { Transaction, LifePillar, SubCategory } from '../types';

interface TransactionsListProps {
  transactions: Transaction[];
  pillars: LifePillar[];
  subCategories: SubCategory[];
  onDelete: (id: string) => void;
  onUpdate: (tx: Transaction) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions, 
  pillars, 
  subCategories, 
  onDelete, 
  onUpdate 
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const pillar = pillars.find(p => p.id === t.pillarId);
      const sub = subCategories.find(s => s.id === t.subCategoryId);
      
      const matchesFilter = filter === 'all' || t.pillarId === filter;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.amount.toString().includes(searchTerm) ||
                            (sub?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchTerm, subCategories, pillars]);

  const formatFullTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const handleUpdateSubmit = () => {
    if (editingTx) {
      onUpdate(editingTx);
      setEditingTx(null);
    }
  };

  const availableEditSubs = useMemo(() => {
    if (!editingTx) return [];
    return subCategories.filter(s => String(s.pillarId) === String(editingTx.pillarId));
  }, [subCategories, editingTx?.pillarId]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center flex-row-reverse">
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">أرشيف المعاملات</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">إدارة شاملة لعمليات الحذف والتعديل</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black">{filteredTransactions.length} عملية</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-row-reverse">
           <div className="flex-1 relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              <input 
                type="text" 
                placeholder="ابحث بالوصف، المبلغ أو البند الفرعي..." 
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-sm text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-row-reverse">
              <button 
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border ${
                  filter === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                }`}
              >
                كافة الركائز
              </button>
              {pillars.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setFilter(p.id)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border ${
                    filter === p.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {p.icon} {p.name}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-32 text-slate-300">
            <span className="text-6xl block mb-6 opacity-20">🔎</span>
            <p className="text-lg font-black text-slate-400">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const pillar = pillars.find(p => p.id === tx.pillarId);
            const sub = subCategories.find(s => s.id === tx.subCategoryId);
            
            return (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 rounded-3xl transition-all group border border-slate-50 hover:border-slate-200 flex-row-reverse"
              >
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-white shrink-0"
                    style={{ backgroundColor: `${pillar?.color}15`, color: pillar?.color }}
                  >
                    {pillar?.icon || '💰'}
                  </div>
                  <div className="min-w-0 text-right">
                    <h4 className="font-black text-slate-800 text-sm truncate flex items-center justify-end gap-2">
                      {sub && (
                        <span className="text-[8px] bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-lg font-black">
                          {sub.name}
                        </span>
                      )}
                      {tx.description}
                    </h4>
                    <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 font-black uppercase mt-1 tabular-nums">
                      <span className="text-indigo-500">{formatFullTime(tx.date)}</span>
                      <span className="opacity-30">•</span>
                      <span>{new Date(tx.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-row-reverse">
                  <div className="text-left flex flex-col items-start">
                    <span className={`text-xl font-black tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString()} 
                    </span>
                    <span className="text-[9px] font-black text-slate-300 uppercase">ج.م</span>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingTx(tx)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('حذف هذه العملية بشكل نهائي؟ سيتم عكس أثرها على الرصيد.')) onDelete(tx.id);
                      }}
                      className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-bounceIn max-h-[95vh] overflow-y-auto custom-scrollbar text-right">
            <h2 className="text-2xl font-black text-slate-800 mb-8">تعديل تفاصيل العملية</h2>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block mb-1">المبلغ المالي</label>
                <input 
                  type="number"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none text-2xl font-black text-indigo-600 text-left"
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block mb-1">البيان / الوصف</label>
                <input 
                  type="text"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right"
                  value={editingTx.description}
                  onChange={(e) => setEditingTx({ ...editingTx, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block mb-1">الركيزة</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-right"
                    value={editingTx.pillarId}
                    onChange={(e) => setEditingTx({ ...editingTx, pillarId: e.target.value, subCategoryId: '' })}>
                    {pillars.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block mb-1">نوع العملية</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-right"
                    value={editingTx.type}
                    onChange={(e) => setEditingTx({ ...editingTx, type: e.target.value as any })}>
                    <option value="EXPENSE">مصروف (-)</option>
                    <option value="INCOME">إيداع (+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase pr-2 block mb-1">البند الفرعي</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-right"
                  value={editingTx.subCategoryId || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, subCategoryId: e.target.value })}>
                  <option value="">-- بدون تصنيف فرعي --</option>
                  {availableEditSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <button onClick={handleUpdateSubmit} className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-lg hover:bg-slate-800 transition-all">
                  حفظ التعديلات والتسوية
                </button>
                <button onClick={() => setEditingTx(null)} className="w-full text-slate-400 font-bold text-[10px] uppercase py-2">تراجع</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
