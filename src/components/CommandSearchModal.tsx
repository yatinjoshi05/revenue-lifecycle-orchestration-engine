import React, { useState, useEffect } from 'react';
import { Search, Handshake, Building2, Users, ListTodo, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/DataContext';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({ open, onClose }) => {
  const { opportunities, accounts, contacts, tasks } = useCRM();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  const matchingOpps = opportunities
    .filter((o) => o.name.toLowerCase().includes(q))
    .slice(0, 5);

  const matchingAccounts = accounts
    .filter((a) => a.name.toLowerCase().includes(q))
    .slice(0, 4);

  const matchingContacts = contacts
    .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    .slice(0, 4);

  const matchingTasks = tasks
    .filter((t) => t.title.toLowerCase().includes(q))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl z-10 overflow-hidden text-popover-foreground animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search records…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {matchingOpps.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">Opportunities</div>
              {matchingOpps.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => {
                    navigate(`/opportunities/${opp.id}`);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 hover:bg-accent text-left text-foreground"
                >
                  <Handshake className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{opp.name}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{opp.stage}</span>
                </button>
              ))}
            </div>
          )}

          {matchingAccounts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">Accounts</div>
              {matchingAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    navigate('/accounts');
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 hover:bg-accent text-left text-foreground"
                >
                  <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{acc.name}</span>
                  <span className="text-[11px] text-muted-foreground">{acc.industry}</span>
                </button>
              ))}
            </div>
          )}

          {matchingContacts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">Contacts</div>
              {matchingContacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    navigate('/contacts');
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 hover:bg-accent text-left text-foreground"
                >
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">{c.role}</span>
                </button>
              ))}
            </div>
          )}

          {matchingTasks.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">Tasks</div>
              {matchingTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    navigate('/tasks');
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 hover:bg-accent text-left text-foreground"
                >
                  <ListTodo className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground">{t.status}</span>
                </button>
              ))}
            </div>
          )}

          {matchingOpps.length === 0 &&
            matchingAccounts.length === 0 &&
            matchingContacts.length === 0 &&
            matchingTasks.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
