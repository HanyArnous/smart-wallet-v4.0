
import React, { useState } from 'react';

interface AuthOverlayProps {
  onAuthenticated: () => void;
  savedPassword?: string;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onAuthenticated, savedPassword }) => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (savedPassword && password !== savedPassword) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onAuthenticated();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[1000] font-['Cairo']">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500 animate-pulse">
            💰
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-slate-950 flex items-center justify-center text-white text-[10px] font-black">
            PRO
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-2">المحفظة الذكية</h1>
          <p className="text-slate-500 font-bold text-sm">أدخل كلمة المرور أو استخدم البصمة</p>
        </div>

        <div className="space-y-6">
          {savedPassword && (
            <div className="relative">
              <input 
                type="password"
                placeholder="كلمة المرور الرقمية"
                className={`w-full p-6 bg-white/5 border ${error ? 'border-rose-500 animate-shake' : 'border-white/10'} rounded-[2rem] text-white text-center text-2xl tracking-[1em] outline-none focus:bg-white/10 transition-all`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {error && <p className="text-rose-500 text-[10px] font-black mt-2 uppercase">كلمة المرور غير صحيحة</p>}
            </div>
          )}

          <button 
            disabled={loading}
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white p-6 rounded-[2.5rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 group relative overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-black">جاري الدخول...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">👆</span>
                <span className="font-black text-lg">فتح المحفظة</span>
              </div>
            )}
          </button>
        </div>

        <div className="pt-10">
           <p className="text-slate-600 text-[10px] font-bold leading-relaxed">
             مشفر بالكامل بمعيار AES-256 محلياً<br/>
             لا يتم إرسال أي بيانات مالية خارج جهازك
           </p>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default AuthOverlay;
