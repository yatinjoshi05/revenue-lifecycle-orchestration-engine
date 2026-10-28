import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  UserRound,
  Calendar,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  MoreHorizontal,
  Check,
  Trash2,
  Copy,
  PlusCircle,
} from 'lucide-react';
import { Opportunity, Account, stages, stageLabels, Stage } from '../types/crm';
import { formatMoney, formatCloseDate } from '../utils/format';
import { StageIcon } from './StageIcon';
import { DisplayColumns } from './Toolbar';
import { useCRM } from '../context/DataContext';

interface OpportunityTableProps {
  opportunities: Opportunity[];
  accounts: Account[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onOpenFullPage: (id: string) => void;
  columns: DisplayColumns;
  sortField: string;
  onSort: (field: string) => void;
  sortDirection: 'asc' | 'desc';
}

export const OpportunityTable: React.FC<OpportunityTableProps> = ({
  opportunities,
  accounts,
  selectedId,
  onSelect,
  onOpenFullPage,
  columns,
  sortField,
  onSort,
  sortDirection,
}) => {
  const { moveOpportunityStage, deleteOpportunity, lists, addToList } = useCRM();
  const [activeStageMenuId, setActiveStageMenuId] = useState<string | null>(null);
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const totalAmount = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-background">
            <tr className="text-muted-foreground font-medium select-none">
              <th
                onClick={() => onSort('name')}
                className="sticky left-0 z-20 bg-background py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[240px] border-r border-border/50"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name</span>
                  {getSortIcon('name')}
                </div>
              </th>

              {columns.account && (
                <th
                  onClick={() => onSort('account')}
                  className="py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[180px] border-r border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    <span>Account</span>
                    {getSortIcon('account')}
                  </div>
                </th>
              )}

              <th
                onClick={() => onSort('stage')}
                className="py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[150px] border-r border-border/50"
              >
                <div className="flex items-center gap-1.5">
                  <StageIcon stage="qualification" />
                  <span>Stage</span>
                  {getSortIcon('stage')}
                </div>
              </th>

              {columns.amount && (
                <th
                  onClick={() => onSort('amount')}
                  className="py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[130px] border-r border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="size-3.5" />
                    <span>Amount</span>
                    {getSortIcon('amount')}
                  </div>
                </th>
              )}

              {columns.owner && (
                <th
                  onClick={() => onSort('owner')}
                  className="py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[140px] border-r border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5" />
                    <span>Owner</span>
                    {getSortIcon('owner')}
                  </div>
                </th>
              )}

              {columns.closeDate && (
                <th
                  onClick={() => onSort('closeDate')}
                  className="py-2 px-4 cursor-pointer hover:text-foreground font-medium min-w-[140px] border-r border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>Close date</span>
                    {getSortIcon('closeDate')}
                  </div>
                </th>
              )}

              {columns.nextStep && (
                <th className="py-2 px-4 font-medium min-w-[200px]">
                  <span>Next step</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border text-foreground">
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                  No opportunities match your search or filters.
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => {
                const isSelected = opp.id === selectedId;
                const accountName = accountMap.get(opp.accountId) || '—';

                return (
                  <tr
                    key={opp.id}
                    onClick={() => onSelect(opp.id)}
                    className={`group/row cursor-pointer transition-colors ${
                      isSelected ? 'bg-muted/80' : 'bg-background hover:bg-muted/50'
                    }`}
                  >
                    {/* Name column (sticky) */}
                    <td className={`sticky left-0 z-10 py-2.5 px-4 font-medium min-w-[240px] border-r border-border/50 transition-colors ${
                      isSelected ? 'bg-muted' : 'bg-background group-hover/row:bg-muted/50'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate hover:underline text-foreground">
                          {opp.name}
                        </span>
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenFullPage(opp.id)}
                            className="p-1 rounded-control hover:bg-accent text-muted-foreground hover:text-foreground"
                            title="Open record page"
                          >
                            <ExternalLink className="size-3.5" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveRowMenuId(activeRowMenuId === opp.id ? null : opp.id)
                              }
                              className="p-1 rounded-control hover:bg-accent text-muted-foreground hover:text-foreground"
                              title="More options"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>

                            {activeRowMenuId === opp.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveRowMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/opportunities/${opp.id}`
                                      );
                                      setActiveRowMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 hover:bg-accent"
                                  >
                                    <Copy className="size-3.5" />
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
                                            setActiveRowMenuId(null);
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
                                      if (confirm(`Delete opportunity "${opp.name}"?`)) {
                                        deleteOpportunity(opp.id);
                                      }
                                      setActiveRowMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-destructive hover:bg-accent"
                                  >
                                    <Trash2 className="size-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Account */}
                    {columns.account && (
                      <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[200px] border-r border-border/50">
                        {accountName}
                      </td>
                    )}

                    {/* Stage with direct dropdown */}
                    <td
                      className="py-2.5 px-4 relative border-r border-border/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveStageMenuId(activeStageMenuId === opp.id ? null : opp.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-control px-1.5 py-0.5 hover:bg-accent transition-colors outline-none"
                      >
                        <StageIcon stage={opp.stage} />
                        <span className="text-foreground">{stageLabels[opp.stage]}</span>
                        <ChevronDown className="size-3 text-muted-foreground" />
                      </button>

                      {activeStageMenuId === opp.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveStageMenuId(null)}
                          />
                          <div className="absolute left-4 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground text-xs">
                            {stages.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  moveOpportunityStage(opp.id, st);
                                  setActiveStageMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 hover:bg-accent"
                              >
                                <StageIcon stage={st} />
                                <span className="flex-1 text-left">{stageLabels[st]}</span>
                                {opp.stage === st && <Check className="size-3.5" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Amount */}
                    {columns.amount && (
                      <td className="py-2.5 px-4 tabular-nums text-foreground border-r border-border/50">
                        {formatMoney(opp.amount)}
                      </td>
                    )}

                    {/* Owner */}
                    {columns.owner && (
                      <td className="py-2.5 px-4 text-muted-foreground border-r border-border/50">
                        {opp.owner?.name || 'Unassigned'}
                      </td>
                    )}

                    {/* Close Date */}
                    {columns.closeDate && (
                      <td className="py-2.5 px-4 text-muted-foreground border-r border-border/50">
                        {formatCloseDate(opp.closeDate)}
                      </td>
                    )}

                    {/* Next Step */}
                    {columns.nextStep && (
                      <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[220px]">
                        {opp.nextStep || '—'}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex min-h-10 shrink-0 items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground bg-background">
        <div className="flex items-center gap-4">
          <span>{opportunities.length} opportunities</span>
          <span className="tabular-nums font-medium text-foreground">
            {formatMoney(totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="text-xs disabled:opacity-40 hover:text-foreground cursor-pointer disabled:cursor-default"
          >
            Previous
          </button>
          <span>1/1</span>
          <button
            type="button"
            disabled
            className="text-xs disabled:opacity-40 hover:text-foreground cursor-pointer disabled:cursor-default"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
