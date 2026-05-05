import { useState, useEffect, useCallback } from 'react';
import type { Mosque, AppConfig } from '../types';
import { GoogleSheetsService } from '../lib/GoogleSheetsService';
import { toast } from 'sonner';

export function useMosques() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('app_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      } else {
        const defaultConfig: AppConfig = {
          spreadsheetId: '1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg',
          sheetName: 'Sheet1',
          apiKey: '',
          syncInterval: 5,
        };
        setConfig(defaultConfig);
      }
    } catch {
      setConfig({
        spreadsheetId: '1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg',
        sheetName: 'Sheet1',
        apiKey: '',
        syncInterval: 5,
      });
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!config || !config.spreadsheetId) return;

    setIsLoading(true);
    try {
      const service = new GoogleSheetsService(config);
      const data = await service.fetchMosques();
      const safe = Array.isArray(data) ? data : [];
      setMosques(safe);
      setLastSync(new Date());
      localStorage.setItem('cached_mosques', JSON.stringify(safe));
      localStorage.setItem('last_sync_time', new Date().toISOString());
    } catch (error: any) {
      console.error('Sync Error:', error);
      toast.error(`فشل في مزامنة البيانات: ${error?.message || 'خطأ غير معروف'}`);

      try {
        const cached = localStorage.getItem('cached_mosques');
        if (cached) {
          const parsed = JSON.parse(cached);
          setMosques(Array.isArray(parsed) ? parsed : []);
          const lastSyncTime = localStorage.getItem('last_sync_time');
          if (lastSyncTime) setLastSync(new Date(lastSyncTime));
        } else {
          setMosques([]);
        }
      } catch {
        setMosques([]);
        localStorage.removeItem('cached_mosques');
      }
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config?.spreadsheetId) {
      refreshData();
      const interval = setInterval(refreshData, (config.syncInterval || 5) * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [config, refreshData]);

  const updateMosque = async (mosque: Mosque) => {
    if (!config) return false;
    try {
      const service = new GoogleSheetsService(config);
      await service.updateMosque(mosque);
      setMosques(prev => prev.map(m => m.id === mosque.id ? mosque : m));
      toast.success('تم تحديث البيانات بنجاح');
      return true;
    } catch {
      toast.error('حدث خطأ أثناء تحديث البيانات');
      return false;
    }
  };

  const addMosque = async (mosque: Omit<Mosque, 'id'>) => {
    if (!config) return false;
    try {
      const service = new GoogleSheetsService(config);
      const newMosque = { ...mosque, id: Date.now().toString() };
      await service.addMosque(newMosque);
      setMosques(prev => [...prev, newMosque]);
      toast.success('تمت إضافة المسجد بنجاح');
      return true;
    } catch {
      toast.error('حدث خطأ أثناء إضافة المسجد');
      return false;
    }
  };

  const deleteMosque = async (id: string) => {
    if (!config) return false;
    try {
      const service = new GoogleSheetsService(config);
      await service.deleteMosque(id);
      setMosques(prev => prev.filter(m => m.id !== id));
      toast.success('تم حذف المسجد بنجاح');
      return true;
    } catch {
      toast.error('حدث خطأ أثناء حذف المسجد');
      return false;
    }
  };

  return {
    mosques,
    isLoading,
    lastSync,
    refreshData,
    updateMosque,
    addMosque,
    deleteMosque,
    config,
    updateConfig: (newConfig: AppConfig) => {
      setConfig(newConfig);
      localStorage.setItem('app_config', JSON.stringify(newConfig));
    }
  };
}
