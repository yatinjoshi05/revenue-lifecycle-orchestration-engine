import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  Clock,
  ListTodo,
  Plus,
  Building2,
  Users,
  Handshake,
  Diamond,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Radio,
  Code2,
  ArrowRightLeft,
  ShieldAlert,
  Database,
  RefreshCw,
  Server,
  FileText,
  Shield,
  Settings,
} from 'lucide-react';
import { useCRM } from '../context/DataContext';
import { MemberAvatar } from './MemberAvatar';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenSearch: () => void;
  onOpenNewList?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenSearch,
  onOpenNewList,
  onOpenSettings,
}) => {
  const { currentUser, members, setCurrentUser, lists, resetData } = useCRM();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [controlPlaneOpen, setControlPlaneOpen] = useState(true);
  const [recordsOpen, setRecordsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const getListIcon = (recordType: string) => {
    switch (recordType) {
      case 'opportunities':
        return <Diamond className="size-4 shrink-0" />;
      case 'accounts':
        return <Building2 className="size-4 shrink-0" />;
      case 'contacts':
      default:
        return <Users className="size-4 shrink-0" />;
    }
  };

  const navItemClass = (isActive: boolean) =>
    `peer/menu-button group/menu-button flex w-full items-center overflow-hidden rounded-md px-3 py-2 text-left whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring h-8 text-xs gap-2.5 ${
      isActive
        ? 'bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900 shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
    }`;

  const sidebarContent = (
    <div className="flex size-full flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Sidebar Header & Brand */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 shrink-0 gap-2">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 min-w-0 group"
                title="NEXUS GTM — Go-to-Market Engineering Control Plane"
              >
                {/* Clean rectangular geometric logo */}
                <div className="size-7 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs tracking-wider shadow-xs shrink-0 group-hover:bg-slate-800 transition">
                  NX
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate leading-tight">
                    NEXUS GTM
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-medium">
                    Control Plane
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex size-6 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
                    title="Settings & Integrations"
                    aria-label="Settings"
                  >
                    <Settings className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="flex size-6 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
                  title="Search (⌘K / Ctrl+K)"
                  aria-label="Search"
                >
                  <Search className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="flex size-6 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronsLeft className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Operator Menu */}
            <div className="relative pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 w-full rounded px-1.5 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 outline-none"
                aria-label={`Account menu for ${currentUser.name}`}
              >
                <MemberAvatar member={currentUser} size="sm" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium text-xs text-slate-900 dark:text-slate-100">{currentUser.name}</span>
                  <span className="truncate text-[10px] text-slate-500 leading-none">RevOps Engineer</span>
                </div>
                <ChevronDown className="size-3 text-slate-400 shrink-0" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg text-slate-800 dark:text-slate-200">
                    <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-slate-400">
                      Switch Operator
                    </div>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(m);
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MemberAvatar member={m} size="xs" />
                        <span className="flex-1 truncate">{m.name}</span>
                        {currentUser.id === m.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset CRM to original default state?')) {
                          resetData();
                          setUserMenuOpen(false);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reset CRM records</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-center gap-2 py-1">
            <Link
              to="/dashboard"
              className="size-7 rounded bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs shadow-xs"
              title="NEXUS GTM"
            >
              NX
            </Link>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex size-7 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
                title="Settings & Integrations"
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex size-7 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 outline-none"
              title="Expand sidebar"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Modules */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-2 gap-4">
        {/* NEXUS Control Plane Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setControlPlaneOpen((v) => !v)}
              className="group flex h-6 w-full items-center justify-between rounded px-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
            >
              <span>Control Plane</span>
              <ChevronRight
                className={`size-3 transition-transform duration-150 ${
                  controlPlaneOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
          )}

          {(!collapsed ? controlPlaneOpen : true) && (
            <div className="mt-1 space-y-0.5">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => navItemClass(isActive || location.pathname === '/')}
                title="Dashboard Overview"
              >
                <LayoutDashboard className="size-4 shrink-0" />
                {!collapsed && <span>Dashboard Overview</span>}
              </NavLink>
              <NavLink
                to="/signals"
                className={({ isActive }) => navItemClass(isActive)}
                title="Signals Explorer"
              >
                <Radio className="size-4 shrink-0" />
                {!collapsed && <span>Signals Explorer</span>}
              </NavLink>
              <NavLink
                to="/inspector"
                className={({ isActive }) => navItemClass(isActive)}
                title="Tag & Event Inspector"
              >
                <Code2 className="size-4 shrink-0" />
                {!collapsed && <span>Tag & Event Inspector</span>}
              </NavLink>
              <NavLink
                to="/handoffs"
                className={({ isActive }) => navItemClass(isActive)}
                title="Handoffs & SLA"
              >
                <ArrowRightLeft className="size-4 shrink-0" />
                {!collapsed && <span>Handoffs & SLA</span>}
              </NavLink>
              <NavLink
                to="/accounts-360"
                className={({ isActive }) => navItemClass(isActive || location.pathname.startsWith('/accounts-360'))}
                title="Account 360"
              >
                <Building2 className="size-4 shrink-0" />
                {!collapsed && <span>Account 360</span>}
              </NavLink>
              <NavLink
                to="/integrity"
                className={({ isActive }) => navItemClass(isActive)}
                title="Revenue Integrity"
              >
                <ShieldAlert className="size-4 shrink-0" />
                {!collapsed && <span>Revenue Integrity</span>}
              </NavLink>
              <NavLink
                to="/enrichment"
                className={({ isActive }) => navItemClass(isActive)}
                title="Enrichment Operations"
              >
                <Database className="size-4 shrink-0" />
                {!collapsed && <span>Enrichment Operations</span>}
              </NavLink>
              <NavLink
                to="/operations"
                className={({ isActive }) => navItemClass(isActive)}
                title="Reconciliation & Recon"
              >
                <RefreshCw className="size-4 shrink-0" />
                {!collapsed && <span>Reconciliation</span>}
              </NavLink>
              <NavLink
                to="/system"
                className={({ isActive }) => navItemClass(isActive)}
                title="System Status & Integrations"
              >
                <Server className="size-4 shrink-0" />
                {!collapsed && <span>System Status</span>}
              </NavLink>
              <a
                href="/archify/index.html"
                target="_blank"
                rel="noreferrer"
                className={navItemClass(false)}
                title="Archify Visual Architecture Portfolio"
              >
                <Sparkles className="size-4 shrink-0 text-sky-500" />
                {!collapsed && (
                  <span className="flex items-center justify-between w-full">
                    <span>Architecture Hub</span>
                    <span className="text-[10px] bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded font-mono font-medium">5 Views</span>
                  </span>
                )}
              </a>
            </div>
          )}
        </div>

        {/* CRM Records Section (Preserved) */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setRecordsOpen((v) => !v)}
              className="group flex h-6 w-full items-center justify-between rounded px-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
            >
              <span>CRM Records</span>
              <ChevronRight
                className={`size-3 transition-transform duration-150 ${
                  recordsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
          )}

          {(!collapsed ? recordsOpen : true) && (
            <div className="mt-1 space-y-0.5">
              <NavLink
                to="/opportunities"
                className={({ isActive }) => navItemClass(isActive || location.pathname.startsWith('/opportunities'))}
                title="Opportunities"
              >
                <Handshake className="size-4 shrink-0" />
                {!collapsed && <span>Opportunities</span>}
              </NavLink>
              <NavLink
                to="/accounts"
                className={({ isActive }) => navItemClass(isActive)}
                title="Accounts"
              >
                <Building2 className="size-4 shrink-0" />
                {!collapsed && <span>Accounts</span>}
              </NavLink>
              <NavLink
                to="/contacts"
                className={({ isActive }) => navItemClass(isActive)}
                title="Contacts"
              >
                <Users className="size-4 shrink-0" />
                {!collapsed && <span>Contacts</span>}
              </NavLink>
              <NavLink
                to="/tasks"
                className={({ isActive }) => navItemClass(isActive)}
                title="Tasks"
              >
                <ListTodo className="size-4 shrink-0" />
                {!collapsed && <span>Tasks</span>}
              </NavLink>
            </div>
          )}
        </div>

        {/* Chats Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setChatsOpen((v) => !v)}
              className="group flex h-6 w-full items-center justify-between rounded px-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
            >
              <span>Assistant</span>
              <ChevronRight
                className={`size-3 transition-transform duration-150 ${
                  chatsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
          )}

          {(!collapsed ? chatsOpen : true) && (
            <div className="mt-1 space-y-0.5">
              <NavLink
                to="/chat/new"
                className={({ isActive }) => navItemClass(isActive)}
                title="AI Assistant"
              >
                <Sparkles className="size-4 shrink-0 text-slate-700 dark:text-slate-300" />
                {!collapsed && <span>AI Assistant</span>}
              </NavLink>
            </div>
          )}
        </div>

        {/* Custom Lists Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setListsOpen((v) => !v)}
              className="group flex h-6 w-full items-center justify-between rounded px-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 outline-none"
            >
              <span>Saved Lists</span>
              <ChevronRight
                className={`size-3 transition-transform duration-150 ${
                  listsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
          )}

          {(!collapsed ? listsOpen : true) && (
            <div className="mt-1 space-y-0.5">
              {!collapsed && onOpenNewList && (
                <button
                  type="button"
                  onClick={onOpenNewList}
                  className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none"
                  title="New list"
                >
                  <Plus className="size-3.5 shrink-0" />
                  <span>Create list</span>
                </button>
              )}
              {lists.map((list) => (
                <NavLink
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className={({ isActive }) => navItemClass(isActive)}
                  title={list.name}
                >
                  {getListIcon(list.recordType)}
                  {!collapsed && <span className="truncate">{list.name}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer & Legal (Non-collapsed) */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <NavLink
              to="/privacy"
              className={({ isActive }) =>
                `hover:underline flex items-center gap-1 ${isActive ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`
              }
            >
              <Shield className="w-3 h-3" />
              Privacy
            </NavLink>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <NavLink
              to="/terms"
              className={({ isActive }) =>
                `hover:underline flex items-center gap-1 ${isActive ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`
              }
            >
              <FileText className="w-3 h-3" />
              Terms
            </NavLink>
          </div>
          <div>&copy; {currentYear} NEXUS GTM. Control Plane.</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full transition-all duration-200 shrink-0 ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-white dark:bg-slate-950 h-full shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
