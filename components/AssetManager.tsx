
import React, { useState, useEffect } from 'react';
import { PreciousMetal } from '../types';

interface AssetManagerProps {
  metals: PreciousMetal[];
  onUpdate: (id: string, weight: number, pricePerGram: number) => void;
}

const MetalCard: React.FC<{ metal: PreciousMetal; onUpdate: (id: string, weight: number, price: number) => void }> = ({ metal, onUpdate }) => {
  const [weight, setWeight] = useState(metal.weight);
  const [price, setPrice] = useState(metal.currentPricePerGram);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setWeight(metal.weight);
    setPrice(metal.currentPricePerGram);
    setHasChanged(false);
  }, [metal]);

  const handleWeightChange = (val: number) => {
    setWeight(val);
    setHasChanged(true);
  };

  const handlePriceChange = (val: number) => {
    setPrice(val);
    setHasChanged(true);
  };

  const handleSave = () => {
    onUpdate(metal.id, weight, price);
    setHasChanged(false);
  };

  return (
    <div className="group bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200">
      <div className={`absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-700 ${metal.id === 'GOLD' ? 'bg-amber-400' : 'bg-slate-400'}`} />
      
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="text-right">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{metal.name}</h2>
          <p className="text-slate-400 font-medium">إدارة مخزون الـ {metal.name}</p>
        </div>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white ${metal.id === 'GOLD' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
          {metal.id === 'GOLD' ? '🟡' : '⚪'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 relative z-10">
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 focus-within:border-indigo-300 transition-all">
          <span className="text-slate-400 text-[10px] font-black block mb-2 uppercase tracking-wider text-right">الوزن الحالي (جرام)</span>
          <div className="relative">
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => handleWeightChange(e.target.valueAsNumber || 0)}
              className="bg-transparent text-3xl font-black text-slate-800 w-full outline-none focus:text-indigo-600 text-left tabular-nums"
            />
          </div>
        </div>
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 focus-within:border-indigo-300 transition-all">
          <span className="text-slate-400 text-[10px] font-black block mb-2 uppercase tracking-wider text-right">سعر الجرام الحالي (ج.م)</span>
          <div className="relative">
            <input 
              type="number" 
              value={price} 
              onChange={(e) => handlePriceChange(e.target.valueAsNumber || 0)}
              className="bg-transparent text-3xl font-black text-slate-800 w-full outline-none focus:text-indigo-600 text-left tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className={`p-8 rounded-[2rem] text-center shadow-lg ${metal.id === 'GOLD' ? 'bg-amber-500 shadow-amber-100' : 'bg-slate-700 shadow-slate-100'}`}>
          <span className="text-white/70 text-[10px] font-black block mb-1 uppercase tracking-widest">القيمة الإجمالية التقديرية</span>
          <span className="text-4xl font-black text-white tabular-nums">
            {(weight * price).toLocaleString()} <small className="text-lg font-normal">ج.م</small>
          </span>
        </div>

        {hasChanged && (
          <button 
            onClick={handleSave}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all animate-bounceIn"
          >
            تحديث وحفظ في السجل ✨
          </button>
        )}
      </div>
    </div>
  );
};

const AssetManager: React.FC<AssetManagerProps> = ({ metals, onUpdate }) => {
  return (
    <div className="space-y-8 animate-fadeIn text-right pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {metals.map(metal => (
          <MetalCard key={metal.id} metal={metal} onUpdate={onUpdate} />
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row-reverse items-center justify-between gap-10">
          <div className="text-right flex-1">
            <h3 className="text-3xl font-black mb-4 flex items-center justify-end gap-4">
              تحليل الأصول الصلبة
              <span className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">📊</span>
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              تتبع الذهب والفضة هو جزء أساسي من إدارة الثروة. نظامنا يقوم بحساب القيمة اللحظية لمدخراتك ودمجها تلقائياً في صافي ثروتك الكلي لضمان رؤية مالية شاملة وتتبع دقيق لتقلبات الأسعار.
            </p>
          </div>
          <div className="text-8xl animate-pulse opacity-20 select-none">💎</div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};

export default AssetManager;
