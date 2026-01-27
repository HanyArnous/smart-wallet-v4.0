
import React from 'react';
import { AuditEntry } from '../types';

interface ActivityHistoryProps {
  logs: AuditEntry[];
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ADD': return '✨';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'PAYOUT': return '💸';
      case 'COLLECT': return '📥';
      case 'REDEEM': return '🏦';
      case 'IMPORT': return '☁️';
      case 'RESET': return '🧨';
      default: return '📝';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ADD': return 'إضافة جديدة';
      case 'UPDATE': return 'تعديل بيانات';
      case 'DELETE': return 'حذف نهائي';
      case 'PAYOUT': return 'صرف / سداد';
      case 'COLLECT': return 'تحصيل مبلغ';
      case 'REDEEM': return 'استرداد أصل';
      case 'IMPORT': return 'استيراد بيانات';
      case 'RESET': return 'تصفير شامل';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADD': return 'text-emerald-500 bg-emerald-50';
      case 'UPDATE': return 'text-indigo-500 bg-indigo-50';
      case 'DELETE': return 'text-rose-500 bg-rose-50';
      case 'RESET': return 'text-rose-700 bg-rose-100';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const formatFullTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    }) + ' - ' + date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 text-right">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800">سجل النشاط والتدقيق الزمني</h2>
        <p className="text-[10px] text-slate-400 uppercase font-black mt-1 tracking-widest">مراقبة كافة التغييرات المالية والأصول بدقة</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-20 text-slate-300">
               <span className="text-6xl block mb-4 opacity-20">📜</span>
               <p className="font-black text-lg text-slate-400">لا توجد سجلات بعد</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-5 p-5 bg-slate-50/50 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100 flex-row-reverse text-right">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row-reverse md:items-center justify-between gap-1 mb-2">
                    <h4 className="font-black text-slate-800 text-sm">
                      {getActionLabel(log.action)}: <span className="text-indigo-600">{log.targetName}</span>
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums">
                      {formatFullTimestamp(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 mt-1">
                    {log.details && (
                      <p className="text-xs text-slate-600 font-bold leading-relaxed">
                        {log.details}
                      </p>
                    )}
                    <span className="text-[9px] bg-white text-slate-500 border border-slate-100 px-2 py-0.5 rounded-lg font-black uppercase whitespace-nowrap">
                      {log.targetType}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityHistory;
