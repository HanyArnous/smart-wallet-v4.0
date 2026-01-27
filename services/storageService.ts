
import { AppState } from '../types';

const STORAGE_KEY = 'smart_wallet_db_v3'; // Version upgrade

export const storageService = {
  // Simple Base64 "Encryption" to prevent plain-text snooping on device
  encode: (str: string) => btoa(unescape(encodeURIComponent(str))),
  decode: (str: string) => decodeURIComponent(escape(atob(str))),

  saveState: (state: AppState) => {
    try {
      const serializedState = JSON.stringify(state);
      const encoded = storageService.encode(serializedState);
      localStorage.setItem(STORAGE_KEY, encoded);
    } catch (e) {
      console.error("Critical storage error:", e);
    }
  },

  loadState: (): AppState | null => {
    try {
      const encoded = localStorage.getItem(STORAGE_KEY);
      if (encoded === null) return null;
      const decoded = storageService.decode(encoded);
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to load state:", e);
      return null;
    }
  },

  exportData: () => {
    const state = storageService.loadState();
    if (!state) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `smart_wallet_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  importData: (file: File): Promise<AppState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json.transactions && json.cashBalance !== undefined) {
            resolve(json);
          } else {
            reject("Format Invalid");
          }
        } catch (e) {
          reject("Read Error");
        }
      };
      reader.readAsText(file);
    });
  }
};
