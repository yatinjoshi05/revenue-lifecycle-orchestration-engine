import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Opportunity, Stage, stages, stageLabels } from '../types/crm';
import { StageIcon } from './StageIcon';
import { MemberAvatar } from './MemberAvatar';
import { useCRM } from '../context/DataContext';

interface CreateOpportunityModalProps {
  open: boolean;
  initialStage?: Stage;
  opportunityToEdit?: Opportunity | null;
  onClose: () => void;
  onCreated?: (opp: Opportunity) => void;
}

export const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({
  open,
  initialStage = 'qualification',
  opportunityToEdit,
  onClose,
  onCreated,
}) => {
  const { accounts, contacts, members, currentUser, createOpportunity, updateOpportunity } = useCRM();

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [stage, setStage] = useState<Stage>(initialStage);
  const [amount, setAmount] = useState('0');
  const [closeDate, setCloseDate] = useState('');
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState('');
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (opportunityToEdit) {
      setName(opportunityToEdit.name);
      setAccountId(opportunityToEdit.accountId || '');
      setStage(opportunityToEdit.stage);
      setAmount(String(opportunityToEdit.amount || 0));
      setCloseDate(opportunityToEdit.closeDate || '');
      setContactIds(opportunityToEdit.contactIds || []);
      setNextStep(opportunityToEdit.nextStep || '');
      setOwnerId(opportunityToEdit.owner?.id || currentUser.id);
    } else {
      setName('');
      setAccountId(accounts[0]?.id || '');
      setStage(initialStage || 'qualification');
      setAmount('0');
      // default close date 30 days ahead
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setCloseDate(d.toISOString().split('T')[0]);
      setContactIds([]);
      setNextStep('');
      setOwnerId(currentUser.id);
    }
    setError('');
  }, [open, opportunityToEdit, initialStage, accounts, currentUser]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this opportunity.');
      return;
    }

    setIsPending(true);
    const ownerMember = members.find((m) => m.id === ownerId) || currentUser;

    setTimeout(() => {
      if (opportunityToEdit) {
        updateOpportunity(opportunityToEdit.id, {
          name: name.trim(),
          accountId,
          stage,
          amount: parseFloat(amount) || 0,
          closeDate,
          contactIds,
          nextStep: nextStep.trim(),
          owner: ownerMember,
        });
        setIsPending(false);
        onClose();
      } else {
        const created = createOpportunity({
          name: name.trim(),
          accountId,
          stage,
          amount: parseFloat(amount) || 0,
          closeDate,
          contactIds,
          nextStep: nextStep.trim(),
          owner: ownerMember,
        });
        setIsPending(false);
        if (onCreated) onCreated(created);
        onClose();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {opportunityToEdit ? 'Edit opportunity' : 'Create opportunity'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter the details for your opportunity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-muted-foreground hover:text-foreground outline-none"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-control bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp — Enterprise rollout"
              className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              {stages.map((st) => (
                <option key={st} value={st}>
                  {stageLabels[st]}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Close Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Amount (USD)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 w-full rounded-control border border-input bg-background px-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Close date</label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Related Contacts */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Related contacts</label>
            <select
              value={contactIds[0] || ''}
              onChange={(e) => setContactIds(e.target.value ? [e.target.value] : [])}
              className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.role ? `(${c.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Next Step */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Next step</label>
            <textarea
              rows={2}
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="What needs to happen next?"
              className="w-full rounded-control border border-input bg-background p-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center justify-center rounded-control border border-border bg-background px-3 text-xs font-medium hover:bg-muted text-foreground outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-8 items-center justify-center rounded-control bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90 outline-none disabled:opacity-50"
            >
              {isPending
                ? 'Saving…'
                : opportunityToEdit
                ? 'Save changes'
                : 'Create opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
