import { setActiveProjectId } from '@/database/projectContext';
import { getSyncStatus } from '@/database/syncOutbox';
import { syncProject } from '@/services/syncService';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  activeProject: { id: string; name: string; role: string } | null;
  setActiveProject: (project: { id: string; name: string; role: string } | null) => void;
  syncStatus: { status: string; pendingCount: number; lastError?: string | null };
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeProject, setActiveProjectState] = useState<AppContextType['activeProject']>(null);
  const [syncStatus, setSyncStatus] = useState<AppContextType['syncStatus']>({ status: 'offline', pendingCount: 0 });

  const setActiveProject = (project: AppContextType['activeProject']) => {
    setActiveProjectState(project);
    setActiveProjectId(project?.id || null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const syncNow = async () => {
    if (!activeProject) return;
    setSyncStatus({ ...getSyncStatus(activeProject.id), status: 'syncing' });
    try {
      await syncProject(activeProject.id);
    } catch (error) {
      // The outbox retains failed operations for a later retry.
    }
    setSyncStatus(getSyncStatus(activeProject.id));
  };

  useEffect(() => {
    if (!activeProject) {
      setSyncStatus({ status: 'offline', pendingCount: 0 });
      return;
    }
    syncNow();
  }, [activeProject?.id, refreshTrigger]);

  return (
    <AppContext.Provider value={{ refreshTrigger, triggerRefresh, activeProject, setActiveProject, syncStatus, syncNow }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};