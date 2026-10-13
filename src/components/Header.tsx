import React from 'react';
import { PanelLeft, Handshake, Building2, Users, ListTodo, Plus, Link, Check, Radio } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { CogLoopIcon } from './CogLoopIcon';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  title?: string;
  icon?: 'opportunities' | 'accounts' | 'contacts' | 'tasks' | 'telemetry';
  recordName?: string;
  onOpenCreate?: () => void;
  createLabel?: string;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  title = 'Opportunities',
  icon = 'opportunities',
  recordName,
  onOpenCreate,
  createLabel = 'Create opportunity',
  onOpenSettings,
}) => {
  const [copied, setCopied] = React.useState(false);

  const getIcon = () => {
    switch (icon) {
      case 'accounts':
        return <Building2 className="size-4 shrink-0 text-muted-foreground" />;
      case 'contacts':
        return <Users className="size-4 shrink-0 text-muted-foreground" />;
      case 'tasks':
        return <ListTodo className="size-4 shrink-0 text-muted-foreground" />;
      case 'telemetry':
        return <Radio className="size-4 shrink-0 text-blue-500" />;
      case 'opportunities':
      default:
        return <Handshake className="size-4 shrink-0 text-muted-foreground" />;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="group/page-header flex min-h-[calc(2.5rem+1px)] h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3 py-1.5 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-foreground outline-none"
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="h-4 w-px bg-border shrink-0" />
        </div>

        <div className="flex items-center gap-2 min-w-0 text-sm font-medium">
          {getIcon()}
          {recordName ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <RouterLink
                to="/opportunities"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Opportunities
              </RouterLink>
              <span className="text-muted-foreground font-normal">›</span>
              <span className="truncate">{recordName}</span>
            </div>
          ) : (
            <h1 className="truncate text-sm font-medium">{title}</h1>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {recordName ? (
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 rounded-control border border-border bg-background px-3 h-7 text-xs font-medium hover:bg-muted outline-none transition-colors"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Link className="size-3.5" />}
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        ) : onOpenCreate ? (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-1 rounded-control border border-border bg-background px-3 h-7 text-xs font-medium hover:bg-primary/90 bg-primary text-primary-foreground outline-none transition-colors"
          >
            <Plus className="size-3.5" />
            <span>{createLabel}</span>
          </button>
        ) : null}

        <div className="h-4 w-px bg-border shrink-0 my-auto mx-0.5" />

        {/* Global Theme Toggle */}
        <ThemeToggle />

        {/* Settings Trigger */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex size-7 items-center justify-center rounded-control border border-border bg-background text-foreground hover:bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            title="Settings"
            aria-label="Settings"
          >
            <CogLoopIcon size={16} className="text-foreground shrink-0" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
