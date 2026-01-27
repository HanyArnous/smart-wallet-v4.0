
import React, { useState } from 'react';
import { parseBankSMS, ParsedSMS } from '../services/geminiService';
import { LifePillar, Transaction } from '../types';

interface SMSParserProps {
  pillars: LifePillar[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const SMSParser: React.FC<SMSParserProps> = ({ pillars, onAddTransaction }) => {
  const [smsText, setSmsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ParsedSMS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!smsText.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const parsed = await parseBankSMS(smsText, pillars);
      if (parsed && parsed.amount > 0) {
        setResult(parsed);
      } else {
        setError("لم نتمكن من العثور على مبالغ في النص.");
      }
    } catch (e) {
      setError("حدث خطأ أثناء التحليل. حاول مرة أخرى.");
    } finally {
      setIsParsing(false);
    }
  };

  const confirmAdd = () => {
    if (result) {
      onAddTransaction({
        amount: result.amount,
        description: `تحليل: ${result.vendor}`,
        date: new Date().toISOString(),
        type: result.type,
        pillarId: result.suggestedPillarId || pillars[0].id,
        isAuto: true
      });
      setResult(null);
      setSmsText('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full">
      <h3 className="font-black text-lg mb-4 flex items-center gap-2">
        <span className="text-indigo-500">🤖</span> محلل الرسائل الذكي
      </h3>
      <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase leading-relaxed">انسخ رسالة البنك (CIB, Vodafone Cash, etc) هنا وسيتم تحويلها لعملية تلقائية.</p>
      
      <textarea 
        className="w-full flex-1 min-h-[120px] p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/5 text-xs font-bold resize-none mb-4 transition-all"
        placeholder="إلصق نص الرسالة هنا..."
        value={smsText}
        onChange={(e) => setSmsText(e.target.value)}
      />

      {error && <p className="text-rose-500 text-[10px] font-black mb-4 pr-2">⚠️ {error}</p>}

      <button 
        disabled={isParsing || !smsText}
        onClick={handleParse}
        className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
          isParsing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg active:scale-95'
        }`}
      >
        {isParsing ? (
          <><div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/> جاري التحليل...</>
        ) : 'تحليل البيانات الآن'}
      </button>

      {result && (
        <div className="mt-6 p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] animate-bounceIn shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-400 uppercase">جهة المعاملة</span>
              <span className="text-xs font-black text-slate-700 truncate max-w-[150px]">{result.vendor}</span>
            </div>
            <div className="text-left">
              <span className="text-[8px] font-black text-indigo-400 uppercase">المبلغ</span>
              <p className="text-lg font-black text-indigo-600 tabular-nums">{result.amount.toLocaleString()} <small className="text-[9px]">ج.م</small></p>
            </div>
          </div>
          <button 
            onClick={confirmAdd} 
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            تأكيد التسجيل في {pillars.find(p => p.id === result.suggestedPillarId)?.name || 'الرئيسية'}
          </button>
          <button onClick={() => setResult(null)} className="w-full text-slate-400 font-bold text-[10px] mt-4 uppercase">إلغاء</button>
        </div>
      )}
    </div>
  );
};

export default SMSParser;
