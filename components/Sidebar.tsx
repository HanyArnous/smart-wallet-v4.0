
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'الرئيسية', icon: '📊' },
    { id: 'transactions', name: 'العمليات', icon: '💸' },
    { id: 'receivables', name: 'المستحقات', icon: '🏠' },
    { id: 'certificates', name: 'الشهادات', icon: '🏦' },
    { id: 'assets', name: 'المعادن', icon: '🏆' },
    { id: 'planning', name: 'الأقساط', icon: '📅' },
    { id: 'analytics', name: 'تقارير', icon: '📈' },
    { id: 'audit', name: 'سجل النشاط', icon: '📝' }, // الخيار الجديد
    { id: 'settings', name: 'إعدادات', icon: '⚙️' },
    { id: 'contact', name: 'اتصل بنا', icon: '📱' },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white border-l border-slate-200 flex-col h-full shadow-xl">
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-lg">
            💰
          </div>
          <h1 className="mt-4 font-black text-slate-800 text-lg tracking-tight">المحفظة الذكية</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md font-bold' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl ml-3">{item.icon}</span>
              <span className="text-xs">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 pt-2 pb-[env(safe-area-inset-bottom)] z-[150] flex overflow-x-auto scrollbar-hide">
        <div className="flex min-w-full justify-around items-center gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${
                activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] font-black mt-1 whitespace-nowrap">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
