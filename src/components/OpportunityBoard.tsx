import React, { useState } from 'react';
import {
  Plus,
  Building2,
  Diamond,
  CalendarDays,
  ExternalLink,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';
import { Opportunity, Account, Stage, stages, stageLabels } from '../types/crm';
import { formatMoney, formatCloseDate } from '../utils/format';
import { StageIcon } from './StageIcon';
import { MemberAvatar } from './MemberAvatar';
import { DisplayColumns } from './Toolbar';
import { useCRM } from '../context/DataContext';

interface OpportunityBoardProps {
  opportunities: Opportunity[];
  accounts: Account[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onOpenFullPage: (id: string) => void;
  onCreateInStage: (stage: Stage) => void;
  columns: DisplayColumns;
}

export const OpportunityBoard: React.FC<OpportunityBoardProps> = ({
  opportunities,
  accounts,
  selectedId,
  onSelect,
  onOpenFullPage,
  onCreateInStage,
  columns,
}) => {
  const { moveOpportunityStage, deleteOpportunity, lists, addToList } = useCRM();
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  // Display stages that have opportunities or standard pipeline stages
  const activePipelineStages: Stage[] = ['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost'].filter(
    (st) => ['qualification', 'discovery', 'proposal', 'negotiation'].includes(st) || opportunities.some((o) => o.stage === st)
  ) as Stage[];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedOppId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData('text/plain') || draggedOppId;
    if (id) {
      moveOpportunityStage(id, targetStage);
    }
    setDraggedOppId(null);
  };

  return (
    <section
      aria-label="Opportunity pipeline"
      data-opportunity-board="true"
      className="flex min-h-0 flex-1 scroll-fade-x gap-3 overflow-x-auto overscroll-x-contain px-6 pb-3 pt-4 select-none"
    >
      {activePipelineStages.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage);
        const stageTotal = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
        const isDragOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
            className={`flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border transition-colors ${
              isDragOver ? 'border-primary/50 bg-accent/30' : 'border-border/60'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <StageIcon stage={stage} />
                <span className="text-xs font-semibold text-foreground">
                  {stageLabels[stage]}
                </span>
                <span className="flex items-center justify-center rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {stageOpps.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCreateInStage(stage)}
                aria-label={`Create opportunity in ${stageLabels[stage]}`}
                className="flex size-6 items-center justify-center rounded-control hover:bg-muted text-muted-foreground hover:text-foreground outline-none"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-2 p-2 min-h-28 scroll-fade-y">
              {stageOpps.map((opp) => {
                const isSelected = opp.id === selectedId;
                const accountName = accountMap.get(opp.accountId);

                return (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    onClick={() => onSelect(opp.id)}
                    className={`group/card relative rounded-lg border bg-card p-3 shadow-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-ring/60'
                    }`}
                  >
                    {/* Card Title & Actions */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover/card:underline">
                        {opp.name}
                      </h4>
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenFullPage(opp.id)}
                          className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Open full page"
                        >
                          <ExternalLink className="size-3" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === opp.id ? null : opp.id)
                            }
                            className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Actions"
                          >
                            <MoreHorizontal className="size-3" />
                          </button>

                          {activeMenuId === opp.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/opportunities/${opp.id}`
                                    );
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 hover:bg-accent"
                                >
                                  <Copy className="size-3" />
                                  <span>Copy link</span>
                                </button>
                                <div className="my-1 h-px bg-border" />
                                <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold">
                                  Add to list
                                </div>
                                {lists
                                  .filter((l) => l.recordType === 'opportunities')
                                  .map((list) => {
                                    const inList = list.recordIds.includes(opp.id);
                                    return (
                                      <button
                                        key={list.id}
                                        type="button"
                                        onClick={() => {
                                          addToList(list.id, opp.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="flex w-full items-center justify-between rounded-control px-2 py-1.5 hover:bg-accent text-left"
                                      >
                                        <span className="truncate">{list.name}</span>
                                        {inList && <Check className="size-3 text-emerald-600" />}
                                      </button>
                                    );
                                  })}
                                <div className="my-1 h-px bg-border" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete "${opp.name}"?`)) {
                                      deleteOpportunity(opp.id);
                                    }
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-destructive hover:bg-accent"
                                >
                                  <Trash2 className="size-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Fields based on display properties */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {columns.account && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{accountName || 'No account'}</span>
                        </div>
                      )}

                      {columns.amount && (
                        <div className="flex items-center gap-1.5">
                          <Diamond className="size-3.5 shrink-0" />
                          <span className="tabular-nums font-medium text-foreground">
                            {formatMoney(opp.amount)}
                          </span>
                        </div>
                      )}

                      {columns.closeDate && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 shrink-0" />
                          <span>{formatCloseDate(opp.closeDate)}</span>
                        </div>
                      )}

                      {columns.owner && (
                        <div className="flex items-center gap-1.5">
                          <MemberAvatar member={opp.owner} size="xs" />
                          <span>{opp.owner?.name || 'Unassigned'}</span>
                        </div>
                      )}

                      {columns.nextStep && opp.nextStep && (
                        <div className="pt-1 text-[11px] text-muted-foreground border-t border-border/40 line-clamp-2">
                          {opp.nextStep}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Create Opportunity button in column bottom */}
              <button
                type="button"
                onClick={() => onCreateInStage(stage)}
                className="flex w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              >
                <Plus className="size-3.5" />
                <span>Create opportunity</span>
              </button>
            </div>

            {/* Column Footer */}
            <div className="flex min-h-9 shrink-0 items-center gap-1.5 border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              <Diamond className="size-3.5 shrink-0" />
              <output className="tabular-nums font-medium text-foreground">
                {formatMoney(stageTotal)}
              </output>
            </div>
          </div>
        );
      })}
    </section>
  );
};
