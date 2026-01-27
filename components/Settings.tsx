
import React, { useState, useRef } from 'react';
import { AppState, InvestmentSettings as ISet } from '../types';

interface SettingsProps {
  state: AppState;
  onUpdateBudget: (id: string, amount: number) => void;
  onAddSubCategory: (pillarId: string, name: string) => void;
  onDeleteSubCategory: (id: string) => void;
  onUpdateInvestmentSettings: (settings: ISet) => void;
  onUpdatePassword: (pw: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: (options: { 
    transactions: boolean; 
    installments: boolean; 
    receivables: boolean; 
    certificates: boolean; 
    metals: boolean; 
    settings: boolean; 
  }) => void;
}

const PillarBudgetInput: React.FC<{ pillarId: string; initialBudget: number; onSave: (id: string, val: number) => void }> = ({ pillarId, initialBudget, onSave }) => {
  const [val, setVal] = useState(initialBudget);

  return (
    <div className="relative w-full md:w-48">
      <input 
        type="number" 
        value={val} 
        onChange={e => setVal(e.target.valueAsNumber || 0)}
        onBlur={() => {
          if (val !== initialBudget) onSave(pillarId, val);
        }}
        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black outline-none focus:border-indigo-500 transition-all text-left tabular-nums" 
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 pointer-events-none">ج.م</span>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ 
  state, onUpdateBudget, onAddSubCategory, onDeleteSubCategory, 
  onUpdateInvestmentSettings, onUpdatePassword, onExport, onImport, onReset 
}) => {
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [tempPassword, setTempPassword] = useState(state.appPassword || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // حالة خيارات التصفير
  const [resetOptions, setResetOptions] = useState({
    transactions: true,
    installments: false,
    receivables: false,
    certificates: false,
    metals: false,
    settings: false,
  });

  const handleAddSub = (pillarId: string) => {
    const name = newSubNames[pillarId];
    if (name?.trim()) {
      onAddSubCategory(pillarId, name.trim());
      setNewSubNames({ ...newSubNames, [pillarId]: '' });
    }
  };

  const handleResetData = () => {
    onReset(resetOptions);
    setShowResetConfirm(false); 
  };

  const toggleAllResetOptions = (val: boolean) => {
    setResetOptions({
      transactions: val,
      installments: val,
      receivables: val,
      certificates: val,
      metals: val,
      settings: val,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn px-2 pb-20 text-right">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row-reverse justify-between items-center gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-900 mb-1">إعدادات النظام والبيانات</h2>
           <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">إدارة الأمان والنسخ الاحتياطي</p>
        </div>
        <button onClick={() => setShowResetConfirm(true)} className="bg-rose-50 text-rose-500 font-black px-6 py-3 rounded-2xl text-[10px] hover:bg-rose-500 hover:text-white transition-all uppercase">
          خيارات التصفير
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black mb-6 flex items-center justify-end gap-2">
           القفل الرقمي والأمان <span className="text-slate-400">🛡️</span>
        </h3>
        <div className="flex flex-col md:flex-row-reverse gap-4 items-end">
          <div className="flex-1 w-full text-right">
            <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase pr-2">كلمة مرور التطبيق</label>
            <input 
              type="password" 
              placeholder="اتركه فارغاً لإلغاء القفل"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { onUpdatePassword(tempPassword); alert('تم تحديث إعدادات الأمان بنجاح'); }}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs h-[58px] active:scale-95 transition-all w-full md:w-auto"
          >
            تحديث القفل
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
        <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-8 gap-4">
          <div className="text-right">
            <h3 className="text-lg font-black flex items-center justify-end gap-2">
              إعدادات الاستثمار الذكي <span className="text-amber-500 text-2xl">🏆</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">تخصيص معايير تحويل الفائض لمعادن</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-row-reverse">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={state.investmentSettings.enabled}
              onChange={(e) => onUpdateInvestmentSettings({ ...state.investmentSettings, enabled: e.target.checked })}
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="me-3 text-xs font-black text-slate-600">{state.investmentSettings.enabled ? 'مفعل' : 'معطل'}</span>
          </label>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all ${state.investmentSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase px-1">نسبة الفائض المطلوبة (%)</label>
            <input type="number" value={state.investmentSettings.thresholdPercentage} onChange={(e) => onUpdateInvestmentSettings({ ...state.investmentSettings, thresholdPercentage: e.target.valueAsNumber })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none tabular-nums" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase px-1">الحد الأدنى للأيام (يوم)</label>
            <input type="number" value={state.investmentSettings.minDays} onChange={(e) => onUpdateInvestmentSettings({ ...state.investmentSettings, minDays: e.target.valueAsNumber })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none tabular-nums" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center group hover:border-indigo-100 transition-all">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform">📤</div>
          <h4 className="font-black text-slate-800 mb-2">تصدير نسخة احتياطية</h4>
          <button onClick={onExport} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xs">حفظ الملف الآن</button>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center group hover:border-emerald-100 transition-all">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform">📥</div>
          <h4 className="font-black text-slate-800 mb-2">استعادة بيانات قديمة</h4>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xs">رفع ملف JSON</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 text-lg mb-8">هيكل الركائز والميزانيات التقديرية</h3>
        <div className="space-y-6">
          {state.pillars.map(pillar => (
            <div key={pillar.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row-reverse items-center gap-6 mb-6 text-right w-full">
                <div className="flex items-center justify-end gap-4 flex-1">
                  <h4 className="font-black text-slate-800">{pillar.name}</h4>
                  <span className="text-3xl p-3 bg-white rounded-2xl shadow-sm" style={{ color: pillar.color }}>{pillar.icon}</span>
                </div>
                <PillarBudgetInput pillarId={pillar.id} initialBudget={pillar.budget} onSave={onUpdateBudget} />
              </div>
              <div className="flex flex-wrap gap-2 mb-4 justify-end">
                {state.subCategories.filter(s => String(s.pillarId) === String(pillar.id)).map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-black text-slate-500 flex-row-reverse">
                    {sub.name}
                    <button onClick={() => onDeleteSubCategory(sub.id)} className="text-slate-300 hover:text-rose-500">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-row-reverse">
                <input type="text" placeholder="بند فرعي جديد..." value={newSubNames[pillar.id] || ''}
                  onChange={e => setNewSubNames({ ...newSubNames, [pillar.id]: e.target.value })}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs text-right" />
                <button onClick={() => handleAddSub(pillar.id)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black">إضافة</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 text-right animate-bounceIn shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <span className="text-5xl block mb-6 text-center">⚙️</span>
            <h3 className="text-xl font-black text-slate-900 mb-2 text-center">خيارات التصفير المتقدم</h3>
            <p className="text-xs text-slate-500 font-bold mb-8 text-center">حدد البيانات التي ترغب في حذفها نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
            
            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                 <button onClick={() => toggleAllResetOptions(true)} className="text-[10px] font-black text-indigo-600">تحديد الكل</button>
                 <button onClick={() => toggleAllResetOptions(false)} className="text-[10px] font-black text-slate-400">إلغاء التحديد</button>
               </div>

               <div className="grid grid-cols-1 gap-3">
                 {[
                   { id: 'transactions', label: 'العمليات والسجل المالي (يصفر الرصيد)', icon: '💸' },
                   { id: 'installments', label: 'جدول الأقساط والالتزامات', icon: '📅' },
                   { id: 'receivables', label: 'المستحقات والديون', icon: '🏠' },
                   { id: 'certificates', label: 'الشهادات البنكية والاستثمار', icon: '🏦' },
                   { id: 'metals', label: 'أوزان الذهب والفضة (تصفير فقط)', icon: '🏆' },
                   { id: 'settings', label: 'الإعدادات وكلمة المرور', icon: '⚙️' },
                 ].map((opt) => (
                   <label key={opt.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-3 flex-row-reverse">
                         <span className="text-xl">{opt.icon}</span>
                         <span className="text-xs font-black text-slate-700">{opt.label}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={(resetOptions as any)[opt.id]} 
                        onChange={(e) => setResetOptions({...resetOptions, [opt.id]: e.target.checked})}
                        className="w-5 h-5 accent-rose-600 rounded-lg" 
                      />
                   </label>
                 ))}
               </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleResetData} 
                disabled={!Object.values(resetOptions).some(Boolean)}
                className={`w-full text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all ${!Object.values(resetOptions).some(Boolean) ? 'bg-slate-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                تأكيد حذف المحدد
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full text-slate-400 font-black text-xs uppercase py-2">تراجع (إلغاء)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
