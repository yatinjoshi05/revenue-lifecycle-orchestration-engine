import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  MessageSquare,
  Check,
  RotateCcw,
  Radio,
  Sparkles,
} from 'lucide-react';
import { CogLoopIcon } from './CogLoopIcon';
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
  const [chatsOpen, setChatsOpen] = useState(true);
  const [recordsOpen, setRecordsOpen] = useState(true);
  const [listsOpen, setListsOpen] = useState(true);

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
    `peer/menu-button group/menu-button flex w-full items-center overflow-hidden rounded-control px-3 py-2 text-left whitespace-nowrap outline-none transition-[width,height,padding] duration-200 focus-visible:ring-2 focus-visible:ring-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm gap-2 pl-3 ${
      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-normal' : 'text-sidebar-foreground'
    }`;

  const sidebarContent = (
    <div className="flex size-full flex-col bg-sidebar select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-2 py-2 h-11 shrink-0 relative">
        {!collapsed ? (
          <>
            {/* User Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-left text-sm hover:bg-sidebar-accent outline-none"
                aria-label={`Account menu for ${currentUser.name}`}
              >
                <MemberAvatar member={currentUser} size="sm" />
                <span className="truncate font-medium text-sm max-w-[110px]">{currentUser.name}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Switch User
                    </div>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setCurrentUser(m);
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <MemberAvatar member={m} size="xs" />
                        <span className="flex-1 truncate">{m.name}</span>
                        {currentUser.id === m.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                    {onOpenSettings && (
                      <>
                        <div className="my-1 h-px bg-border" />
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenSettings();
                          }}
                          className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <CogLoopIcon size={14} className="shrink-0" />
                          <span>Settings</span>
                        </button>
                      </>
                    )}
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset CRM to original default state?')) {
                          resetData();
                          setUserMenuOpen(false);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reset all data</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex size-7 items-center justify-center rounded-control hover:bg-sidebar-accent text-sidebar-foreground outline-none"
                title="Search (⌘K / Ctrl+K)"
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex size-7 items-center justify-center rounded-control hover:bg-sidebar-accent text-sidebar-foreground outline-none"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="size-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-center gap-2 py-1">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex size-7 items-center justify-center rounded-control hover:bg-sidebar-accent text-sidebar-foreground outline-none"
              title="Expand sidebar"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-2 gap-3">
        {/* Home & Tasks */}
        <div className="space-y-0.5">
          <NavLink
            to="/home"
            className={({ isActive }) => navItemClass(isActive)}
            title="Home"
          >
            <Clock className="size-4 shrink-0" />
            {!collapsed && <span>Home</span>}
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

        {/* Chats Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setChatsOpen((v) => !v)}
              className="group flex h-7 w-full items-center justify-between rounded-control px-2 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground outline-none"
            >
              <span>Chats</span>
              <ChevronRight
                className={`size-3.5 transition-transform duration-150 ${
                  chatsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-sidebar-border my-1" />
          )}

          {(!collapsed ? chatsOpen : true) && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink
                to="/chat/new"
                className={({ isActive }) => navItemClass(isActive)}
                title="AI Assistant"
              >
                <Sparkles className="size-4 shrink-0 text-blue-600 dark:text-blue-400 group-hover/menu-button:scale-110 transition-transform" />
                {!collapsed && <span className="font-medium">AI Assistant</span>}
              </NavLink>
            </div>
          )}
        </div>

        {/* Records Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setRecordsOpen((v) => !v)}
              className="group flex h-7 w-full items-center justify-between rounded-control px-2 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground outline-none"
            >
              <span>Records</span>
              <ChevronRight
                className={`size-3.5 transition-transform duration-150 ${
                  recordsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-sidebar-border my-1" />
          )}

          {(!collapsed ? recordsOpen : true) && (
            <div className="mt-0.5 space-y-0.5">
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
                to="/opportunities"
                className={({ isActive }) =>
                  navItemClass(isActive || location.pathname === '/' || location.pathname.startsWith('/opportunities'))
                }
                title="Opportunities"
              >
                <Handshake className="size-4 shrink-0" />
                {!collapsed && <span>Opportunities</span>}
              </NavLink>
            </div>
          )}
        </div>

        {/* GTM Operations Section */}
        <div>
          {!collapsed ? (
            <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">
              Operations
            </div>
          ) : (
            <div className="h-px bg-sidebar-border my-1" />
          )}
          <div className="mt-0.5 space-y-0.5">
            <NavLink
              to="/telemetry"
              className={({ isActive }) => navItemClass(isActive)}
              title="Operations"
            >
              <Radio className="size-4 shrink-0 text-blue-500" />
              {!collapsed && <span>Operations</span>}
            </NavLink>
          </div>
        </div>

        {/* Lists Section */}
        <div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setListsOpen((v) => !v)}
              className="group flex h-7 w-full items-center justify-between rounded-control px-2 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground outline-none"
            >
              <span>Lists</span>
              <ChevronRight
                className={`size-3.5 transition-transform duration-150 ${
                  listsOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="h-px bg-sidebar-border my-1" />
          )}

          {(!collapsed ? listsOpen : true) && (
            <div className="mt-0.5 space-y-0.5">
              {!collapsed && (
                <button
                  type="button"
                  onClick={onOpenNewList}
                  className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm h-8 hover:bg-sidebar-accent text-sidebar-foreground outline-none"
                  title="New list"
                >
                  <Plus className="size-4 shrink-0" />
                  <span>New list</span>
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full border-r border-sidebar-border transition-all duration-200 shrink-0 ${
          collapsed ? 'w-12' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-sidebar h-full shadow-xl z-10 border-r border-sidebar-border">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
