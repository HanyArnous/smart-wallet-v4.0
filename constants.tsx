
import React from 'react';
import { LifePillar, SubCategory, PreciousMetal } from './types';

export const INITIAL_PILLARS: LifePillar[] = [
  { id: '1', name: 'السيارة', icon: '🚗', color: '#ef4444', budget: 0 },
  { id: '2', name: 'المنزل', icon: '🏠', color: '#3b82f6', budget: 0 },
  { id: '3', name: 'الأبناء', icon: '🎓', color: '#10b981', budget: 0 },
  { id: '4', name: 'العمل', icon: '💼', color: '#f59e0b', budget: 0 },
  { id: '5', name: 'ترفيه', icon: '🎬', color: '#8b5cf6', budget: 0 },
];

export const INITIAL_SUB_CATEGORIES: SubCategory[] = [
  { id: 's1', pillarId: '1', name: 'بنزين' },
  { id: 's2', pillarId: '1', name: 'صيانة' },
  { id: 's3', pillarId: '1', name: 'تأمين' },
  { id: 's4', pillarId: '2', name: 'إيجار' },
  { id: 's5', pillarId: '2', name: 'فواتير' },
  { id: 's6', pillarId: '3', name: 'مصاريف مدرسة' },
];

export const INITIAL_METALS: PreciousMetal[] = [
  { id: 'GOLD', name: 'الذهب', weight: 0, karat: 21, currentPricePerGram: 3500 },
  { id: 'SILVER', name: 'الفضة', weight: 0, currentPricePerGram: 45 },
];
