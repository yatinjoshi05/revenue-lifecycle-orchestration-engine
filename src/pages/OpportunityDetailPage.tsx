import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Handshake,
  Building2,
  Calendar,
  Users,
  ChevronDown,
  UserRound,
  FileText,
  DollarSign,
  Plus,
  Check,
} from 'lucide-react';
import { Header } from '../components/Header';
import { StageIcon } from '../components/StageIcon';
import { MemberAvatar } from '../components/MemberAvatar';
import { useCRM } from '../context/DataContext';
import { stages, stageLabels, Stage } from '../types/crm';
import { formatCloseDate } from '../utils/format';

interface OpportunityDetailPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { id } = useParams<{ id: string }>();
  const { opportunities, accounts, contacts, members, updateOpportunity, moveOpportunityStage, addNote } = useCRM();

  const opp = opportunities.find((o) => o.id === id);

  const [newNote, setNewNote] = useState('');
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [contactMenuOpen, setContactMenuOpen] = useState(false);

  if (!opp) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <Header onToggleMobileSidebar={onToggleMobileSidebar} title="Opportunities" />
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Opportunity not found.</p>
          <Link
            to="/opportunities"
            className="rounded-control border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            ← Back to opportunities
          </Link>
        </div>
      </div>
    );
  }

  const currentAccount = accounts.find((a) => a.id === opp.accountId);
  const currentContact = contacts.find((c) => opp.contactIds?.includes(c.id));

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    addNote('opportunities', opp.id, newNote.trim());
    setNewNote('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto">
      {/* Top Header */}
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Opportunities"
        icon="opportunities"
        recordName={opp.name}
        onOpenSettings={onOpenSettings}
      />

      {/* Main Single Opportunity Body */}
      <div className="max-w-3xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Record Header */}
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted border border-border/80">
            <Handshake className="size-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={opp.name}
              onChange={(e) => updateOpportunity(opp.id, { name: e.target.value })}
              className="w-full text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-ring outline-none"
            />
          </div>
        </div>

        {/* Properties Grid */}
        <div className="space-y-4 text-sm divide-y divide-border/60 border-t border-b border-border/60 py-2">
          {/* Name */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <FileText className="size-3.5" />
              <span>Name</span>
            </span>
            <span className="text-xs font-medium text-foreground">{opp.name}</span>
          </div>

          {/* Account */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Building2 className="size-3.5" />
              <span>Account</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-xs hover:bg-muted text-foreground outline-none"
              >
                <span>{currentAccount?.name || 'No account'}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
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
                          updateOpportunity(opp.id, { accountId: acc.id });
                          setAccountMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <span className="truncate">{acc.name}</span>
                        {opp.accountId === acc.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stage */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <StageIcon stage="qualification" />
              <span>Stage</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStageMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-xs hover:bg-muted text-foreground outline-none"
              >
                <StageIcon stage={opp.stage} />
                <span>{stageLabels[opp.stage]}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
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
                          moveOpportunityStage(opp.id, st);
                          setStageMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <StageIcon stage={st} />
                        <span className="flex-1">{stageLabels[st]}</span>
                        {opp.stage === st && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="size-3.5" />
              <span>Amount (USD)</span>
            </span>
            <input
              type="number"
              value={opp.amount}
              onChange={(e) => updateOpportunity(opp.id, { amount: Number(e.target.value) || 0 })}
              className="text-xs bg-transparent border-b border-transparent hover:border-border focus:border-ring outline-none max-w-[200px]"
            />
          </div>

          {/* Close Date */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar className="size-3.5" />
              <span>Close date</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs">{formatCloseDate(opp.closeDate)}</span>
              <input
                type="date"
                value={opp.closeDate}
                onChange={(e) => updateOpportunity(opp.id, { closeDate: e.target.value })}
                className="text-xs bg-transparent border border-input rounded-control px-2 py-0.5 outline-none"
              />
            </div>
          </div>

          {/* Related Contacts */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Users className="size-3.5" />
              <span>Related contacts</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setContactMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-xs hover:bg-muted text-foreground outline-none"
              >
                <span>{currentContact?.name || 'No contact'}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {contactMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setContactMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md text-xs">
                    {contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          updateOpportunity(opp.id, { contactIds: [c.id] });
                          setContactMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <span className="truncate">{c.name}</span>
                        {opp.contactIds?.includes(c.id) && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next Step */}
          <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-2">
            <span className="flex items-center gap-2 text-muted-foreground text-xs pt-1">
              <FileText className="size-3.5" />
              <span>Next step</span>
            </span>
            <textarea
              rows={2}
              value={opp.nextStep || ''}
              onChange={(e) => updateOpportunity(opp.id, { nextStep: e.target.value })}
              className="text-xs bg-transparent border rounded-control border-input p-2 outline-none w-full"
              placeholder="Add next step..."
            />
          </div>

          {/* Owner */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-2 relative">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <UserRound className="size-3.5" />
              <span>Owner</span>
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOwnerMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-xs hover:bg-muted text-foreground outline-none"
              >
                <MemberAvatar member={opp.owner} size="xs" />
                <span>{opp.owner?.name || 'Unassigned'}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
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
                          updateOpportunity(opp.id, { owner: mem });
                          setOwnerMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 hover:bg-accent text-left"
                      >
                        <MemberAvatar member={mem} size="xs" />
                        <span className="flex-1">{mem.name}</span>
                        {opp.owner?.id === mem.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <span className="text-xs text-muted-foreground">+ Add note</span>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
              className="w-full rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-ring resize-none"
            />
            {newNote && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewNote('')}
                  className="rounded-control border border-border px-3 py-1 text-xs hover:bg-muted"
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

          {opp.notes && opp.notes.length > 0 && (
            <div className="space-y-3 pt-2">
              {opp.notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <MemberAvatar member={note.author} size="xs" />
                      <span>{note.author?.name}</span>
                    </div>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{note.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
