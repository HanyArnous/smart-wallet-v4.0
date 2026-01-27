
import React from 'react';

const ContactUs: React.FC = () => {
  const openWhatsApp = () => {
    const phone = "201004126245"; // إضافة كود مصر
    const url = `https://wa.me/${phone}?text=مرحباً، لدي استفسار بخصوص تطبيق المحفظة الذكية.`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto py-12 text-center animate-fadeIn">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">
        📱
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-4">تواصل معنا</h2>
      <p className="text-slate-500 font-bold mb-10 leading-relaxed px-6">
        نحن هنا لمساعدتك! يمكنك التواصل المباشر مع الدعم الفني عبر الواتساب لأي استفسار أو بلاغ عن مشكلة.
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={openWhatsApp}
          className="w-full bg-emerald-500 text-white p-6 rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all active:scale-95"
        >
          <span className="text-2xl">💬</span>
          مراسلة عبر واتساب
        </button>
        
        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">رقم التواصل المباشر</span>
          <span className="text-xl font-black text-slate-700 tabular-nums">01004126245</span>
        </div>
      </div>
      
      <p className="text-slate-300 text-[10px] mt-20 font-bold">
        Smart Wallet v2.5 • Developed for Efficiency
      </p>
    </div>
  );
};

export default ContactUs;
