import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Link as LinkIcon,
  Check,
  Handshake,
  Building2,
  Calendar,
  Users,
  ChevronsUpDown,
  UserRound,
  FileText,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Opportunity, Stage, stages, stageLabels } from '../types/crm';
import { formatCloseDate } from '../utils/format';
import { StageIcon } from './StageIcon';
import { MemberAvatar } from './MemberAvatar';
import { useCRM } from '../context/DataContext';

interface OpportunityDrawerProps {
  opportunity: Opportunity;
  onClose: () => void;
  onOpenFullPage: (id: string) => void;
}

export const OpportunityDrawer: React.FC<OpportunityDrawerProps> = ({
  opportunity,
  onClose,
  onOpenFullPage,
}) => {
  const { accounts, contacts, members, updateOpportunity, moveOpportunityStage, addNote } = useCRM();

  const [copied, setCopied] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [contactMenuOpen, setContactMenuOpen] = useState(false);

  const currentAccount = accounts.find((a) => a.id === opportunity.accountId);
  const currentContact = contacts.find((c) => opportunity.contactIds?.includes(c.id));

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/opportunities/${opportunity.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim()) return;
    addNote('opportunities', opportunity.id, newNoteText.trim());
    setNewNoteText('');
    setIsAddingNote(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl transition-transform animate-in slide-in-from-right duration-200">
      {/* Top action bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 py-2 bg-background">
        <h3 className="truncate text-xs font-medium text-muted-foreground max-w-[280px]">
          {opportunity.name}
        </h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-muted-foreground hover:text-foreground outline-none transition-colors"
            title="Copy link"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <LinkIcon className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onOpenFullPage(opportunity.id)}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-muted-foreground hover:text-foreground outline-none transition-colors"
            title="Open full page"
          >
            <ExternalLink className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-muted-foreground hover:text-foreground outline-none transition-colors"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Record Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/60">
            <Handshake className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={opportunity.name}
              onChange={(e) => updateOpportunity(opportunity.id, { name: e.target.value })}
              className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-ring outline-none transition-colors"
            />
          </div>
        </div>

        {/* Two-column property list */}
        <div className="space-y-3 text-sm">
          {/* Name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <FileText className="size-3.5" />
              <span>Name</span>
            </span>
            <input
              type="text"
              value={opportunity.name}
              onChange={(e) => updateOpportunity(opportunity.id, { name: e.target.value })}
              className="text-xs bg-transparent border-b border-transparent hover:border-border focus:border-ring outline-none"
            />
          </div>

          {/* Account */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Building2 className="size-3.5" />
              <span>Account</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-control px-2 py-1 text-xs hover:bg-muted text-left outline-none"
              >
                <span className="truncate">{currentAccount?.name || 'No account'}</span>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </button>

              {accountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAccountMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md text-xs">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          updateOpportunity(opportunity.id, { accountId: acc.id });
                          setAccountMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <span className="truncate">{acc.name}</span>
                        {opportunity.accountId === acc.id && <Check className="size-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stage */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <StageIcon stage="qualification" />
              <span>Stage</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStageMenuOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-control px-2 py-1 text-xs hover:bg-muted text-left outline-none"
              >
                <div className="flex items-center gap-2">
                  <StageIcon stage={opportunity.stage} />
                  <span>{stageLabels[opportunity.stage]}</span>
                </div>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </button>

              {stageMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setStageMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 w-48 rounded-lg border border-border bg-popover p-1 shadow-md text-xs">
                    {stages.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          moveOpportunityStage(opportunity.id, st);
                          setStageMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 hover:bg-accent text-left"
                      >
                        <StageIcon stage={st} />
                        <span className="flex-1">{stageLabels[st]}</span>
                        {opportunity.stage === st && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="size-3.5" />
              <span>Amount (USD)</span>
            </span>
            <input
              type="number"
              value={opportunity.amount}
              onChange={(e) => updateOpportunity(opportunity.id, { amount: Number(e.target.value) || 0 })}
              className="text-xs bg-transparent border-b border-transparent hover:border-border focus:border-ring outline-none"
            />
          </div>

          {/* Close Date */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar className="size-3.5" />
              <span>Close date</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{formatCloseDate(opportunity.closeDate)}</span>
              </span>
              <input
                type="date"
                value={opportunity.closeDate}
                onChange={(e) => updateOpportunity(opportunity.id, { closeDate: e.target.value })}
                className="text-xs bg-transparent border border-input rounded-control px-1.5 py-0.5 outline-none text-foreground ml-auto"
              />
            </div>
          </div>

          {/* Related Contacts */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Users className="size-3.5" />
              <span>Related contacts</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setContactMenuOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-control px-2 py-1 text-xs hover:bg-muted text-left outline-none"
              >
                <span className="truncate">{currentContact?.name || 'No contact'}</span>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </button>

              {contactMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setContactMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md text-xs">
                    {contacts.map((con) => (
                      <button
                        key={con.id}
                        type="button"
                        onClick={() => {
                          const contactIds = [con.id];
                          updateOpportunity(opportunity.id, { contactIds });
                          setContactMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <span className="truncate">{con.name}</span>
                        {opportunity.contactIds?.includes(con.id) && <Check className="size-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next Step */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-2 py-1">
            <span className="flex items-center gap-2 text-muted-foreground text-xs pt-1">
              <FileText className="size-3.5" />
              <span>Next step</span>
            </span>
            <textarea
              rows={2}
              value={opportunity.nextStep || ''}
              onChange={(e) => updateOpportunity(opportunity.id, { nextStep: e.target.value })}
              className="text-xs bg-transparent border rounded-control border-transparent hover:border-border focus:border-ring outline-none p-1 resize-none"
              placeholder="Add next step..."
            />
          </div>

          {/* Owner */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-1 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <UserRound className="size-3.5" />
              <span>Owner</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOwnerMenuOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-control px-2 py-1 text-xs hover:bg-muted text-left outline-none"
              >
                <div className="flex items-center gap-2">
                  <MemberAvatar member={opportunity.owner} size="xs" />
                  <span>{opportunity.owner?.name || 'Unassigned'}</span>
                </div>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </button>

              {ownerMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOwnerMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 w-48 rounded-lg border border-border bg-popover p-1 shadow-md text-xs">
                    {members.map((mem) => (
                      <button
                        key={mem.id}
                        type="button"
                        onClick={() => {
                          updateOpportunity(opportunity.id, { owner: mem });
                          setOwnerMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <MemberAvatar member={mem} size="xs" />
                        <span className="flex-1">{mem.name}</span>
                        {opportunity.owner?.id === mem.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Notes</h4>
            <button
              type="button"
              onClick={() => setIsAddingNote(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <Plus className="size-3" />
              <span>Add note</span>
            </button>
          </div>

          {/* New note input box */}
          <div className="space-y-2">
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Write a note..."
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            />
            {newNoteText && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewNoteText('')}
                  className="rounded-control border border-border px-2.5 py-1 text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="rounded-control bg-primary text-primary-foreground px-3 py-1 text-xs font-medium hover:bg-primary/90"
                >
                  Save note
                </button>
              </div>
            )}
          </div>

          {/* Notes list */}
          {opportunity.notes && opportunity.notes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              {opportunity.notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <MemberAvatar member={note.author} size="xs" />
                      <span>{note.author?.name}</span>
                    </div>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{note.body || note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Section */}
        {opportunity.activity && opportunity.activity.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground">Activity</h4>
            <div className="space-y-2">
              {opportunity.activity.map((act) => (
                <div key={act.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="size-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span>{act.summary}</span>
                    <span className="text-[10px] text-muted-foreground/70 ml-2">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
