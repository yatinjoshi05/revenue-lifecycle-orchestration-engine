import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useCRM } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { RloeProvider } from './context/RloeContext';
import { Sidebar } from './components/Sidebar';
import { CommandSearchModal } from './components/CommandSearchModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage';
import { AccountsPage } from './pages/AccountsPage';
import { ContactsPage } from './pages/ContactsPage';
import { TasksPage } from './pages/TasksPage';
import { UpNextPage } from './pages/UpNextPage';
import { ChatPage } from './pages/ChatPage';
import { ListPage } from './pages/ListPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { MovableAssistant } from './components/MovableAssistant';
import { X } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { createList } = useCRM();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newListModalOpen, setNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<'opportunities' | 'accounts' | 'contacts'>('opportunities');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList(newListName.trim(), newListType);
    setNewListName('');
    setNewListModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNewList={() => setNewListModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Routes>
          <Route path="/" element={<Navigate to="/opportunities" replace />} />
          <Route
            path="/opportunities"
            element={
              <OpportunitiesPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/opportunities/:id"
            element={
              <OpportunityDetailPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/accounts"
            element={
              <AccountsPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/contacts"
            element={
              <ContactsPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/tasks"
            element={
              <TasksPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/home"
            element={
              <UpNextPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/chat/new"
            element={
              <ChatPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                title="New chat"
              />
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ChatPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/lists/:id"
            element={
              <ListPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route
            path="/telemetry"
            element={
              <TelemetryPage
                onToggleMobileSidebar={() => setMobileOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/opportunities" replace />} />
        </Routes>
      </main>

      {/* Global Quick Search (⌘K / Ctrl+K) */}
      <CommandSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* GTM & RLOE System Settings Drawer (opened via CogLoopIcon) */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Global Movable Floating AI Assistant Ball & Panel */}
      <MovableAssistant />

      {/* New List Modal */}
      {newListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setNewListModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Create new list</h3>
              <button
                type="button"
                onClick={() => setNewListModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">List Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Priority Q1"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Record Type</label>
                <select
                  value={newListType}
                  onChange={(e) => setNewListType(e.target.value as any)}
                  className="h-8 w-full rounded-control border border-input bg-background px-2.5 outline-none focus:border-ring"
                >
                  <option value="opportunities">Opportunities</option>
                  <option value="accounts">Accounts</option>
                  <option value="contacts">Contacts</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewListModalOpen(false)}
                  className="h-8 rounded-control border border-border px-3 text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-control bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <RloeProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </RloeProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
