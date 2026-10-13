import React, { useState, useRef, useEffect } from 'react';
import {
  Funnel,
  Search,
  Settings2,
  List,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  X,
  Building2,
  CircleDashed,
  UserRound,
  DollarSign,
  Calendar,
  Check,
} from 'lucide-react';
import { ViewMode, stages, stageLabels } from '../types/crm';
import { useCRM } from '../context/DataContext';

export interface DisplayColumns {
  account: boolean;
  amount: boolean;
  owner: boolean;
  closeDate: boolean;
  nextStep: boolean;
}

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStage: string;
  onStageChange: (stage: string) => void;
  selectedAccount: string;
  onAccountChange: (account: string) => void;
  selectedOwner: string;
  onOwnerChange: (owner: string) => void;
  sortField: string;
  onSortFieldChange: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (dir: 'asc' | 'desc') => void;
  columns: DisplayColumns;
  onColumnsChange: (cols: DisplayColumns) => void;
  onResetDisplay: () => void;
  onClearFilters: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedStage,
  onStageChange,
  selectedAccount,
  onAccountChange,
  selectedOwner,
  onOwnerChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  columns,
  onColumnsChange,
  onResetDisplay,
  onClearFilters,
}) => {
  const { accounts, members } = useCRM();

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<'none' | 'account' | 'stage' | 'owner'>('none');
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(!!searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const hasActiveFilters = !!(selectedStage || selectedAccount || selectedOwner || searchQuery);

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || id;
  const getOwnerName = (id: string) =>
    id === 'unassigned' ? 'Unassigned' : members.find((m) => m.id === id)?.name || id;

  return (
    <div className="flex flex-col shrink-0 border-b border-border bg-background">
      {/* Top Toolbar Controls */}
      <div data-collection-controls="true" className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 px-6 py-2 relative">
        {/* Filter Button & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setFilterMenuOpen((v) => !v);
              setActiveFilterSubmenu('none');
            }}
            className={`inline-flex shrink-0 items-center justify-center rounded-control border border-border px-3 h-7 text-xs font-medium gap-1.5 transition-colors outline-none ${
              filterMenuOpen || hasActiveFilters ? 'bg-muted text-foreground' : 'bg-background hover:bg-muted text-foreground'
            }`}
            aria-haspopup="menu"
            aria-expanded={filterMenuOpen}
          >
            <Funnel className="size-3.5" />
            <span>Filter</span>
            {(selectedStage || selectedAccount || selectedOwner) && (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-semibold">
                {[selectedStage, selectedAccount, selectedOwner].filter(Boolean).length}
              </span>
            )}
          </button>

          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-popover p-1 shadow-md text-popover-foreground text-sm">
                {activeFilterSubmenu === 'none' && (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('account')}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span>Account</span>
                      </span>
                      {selectedAccount && <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{getAccountName(selectedAccount)}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('stage')}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <CircleDashed className="size-3.5 text-muted-foreground" />
                        <span>Stage</span>
                      </span>
                      {selectedStage && <span className="text-[11px] text-muted-foreground capitalize">{stageLabels[selectedStage as any] || selectedStage}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('owner')}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <UserRound className="size-3.5 text-muted-foreground" />
                        <span>Owner</span>
                      </span>
                      {selectedOwner && <span className="text-[11px] text-muted-foreground">{getOwnerName(selectedOwner)}</span>}
                    </button>
                  </div>
                )}

                {activeFilterSubmenu === 'account' && (
                  <div className="space-y-0.5 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('none')}
                      className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAccountChange('');
                        setFilterMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span>All accounts</span>
                      {!selectedAccount && <Check className="size-3.5" />}
                    </button>
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          onAccountChange(acc.id);
                          setFilterMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span className="truncate">{acc.name}</span>
                        {selectedAccount === acc.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterSubmenu === 'stage' && (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('none')}
                      className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onStageChange('');
                        setFilterMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span>All stages</span>
                      {!selectedStage && <Check className="size-3.5" />}
                    </button>
                    {stages.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          onStageChange(st);
                          setFilterMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>{stageLabels[st]}</span>
                        {selectedStage === st && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterSubmenu === 'owner' && (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilterSubmenu('none')}
                      className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOwnerChange('');
                        setFilterMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span>All owners</span>
                      {!selectedOwner && <Check className="size-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOwnerChange('unassigned');
                        setFilterMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span>Unassigned</span>
                      {selectedOwner === 'unassigned' && <Check className="size-3.5" />}
                    </button>
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onOwnerChange(m.id);
                          setFilterMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-control px-2.5 py-1.5 text-left text-xs hover:bg-accent"
                      >
                        <span>{m.name}</span>
                        {selectedOwner === m.id && <Check className="size-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Search Field / Icon */}
        {searchOpen || searchQuery ? (
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Find opportunities"
              placeholder="Find opportunities…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onSearchChange('');
                  setSearchOpen(false);
                }
              }}
              className="h-7 w-44 sm:w-56 rounded-control border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 text-muted-foreground hover:text-foreground outline-none"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-7 items-center justify-center rounded-control hover:bg-muted text-foreground outline-none"
            aria-label="Find opportunities"
            title="Find opportunities"
          >
            <Search className="size-4" />
          </button>
        )}

        {/* Display Popover on the Right */}
        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setDisplayMenuOpen((v) => !v)}
            className={`inline-flex shrink-0 items-center justify-center rounded-control border border-border px-3 h-7 text-xs font-medium gap-1.5 transition-colors outline-none ${
              displayMenuOpen ? 'bg-muted text-foreground' : 'bg-background hover:bg-muted text-foreground'
            }`}
            aria-haspopup="dialog"
            aria-expanded={displayMenuOpen}
          >
            <Settings2 className="size-3.5" />
            <span>Display</span>
          </button>

          {displayMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDisplayMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg text-popover-foreground text-sm flex flex-col gap-3">
                {/* View Switcher: Table vs Board */}
                <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => onViewModeChange('table')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-sm py-1 text-xs font-medium transition-all ${
                      viewMode === 'table'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="size-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange('board')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-sm py-1 text-xs font-medium transition-all ${
                      viewMode === 'board'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span>Board</span>
                  </button>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center gap-2">
                  <label htmlFor="opportunity-sort" className="text-xs text-muted-foreground w-12 shrink-0">
                    Sorting
                  </label>
                  <select
                    id="opportunity-sort"
                    value={sortField}
                    onChange={(e) => onSortFieldChange(e.target.value)}
                    className="h-7 w-full rounded-control border border-input bg-background px-2 text-xs outline-none focus:border-ring flex-1"
                  >
                    <option value="name">Name</option>
                    <option value="amount">Amount</option>
                    <option value="closeDate">Close date</option>
                    <option value="updatedAt">Last updated</option>
                    <option value="stage">Stage</option>
                    <option value="account">Account</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="flex size-7 items-center justify-center rounded-control border border-border hover:bg-muted text-foreground outline-none shrink-0"
                    title={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
                    aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
                  >
                    {sortDirection === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                  </button>
                </div>

                {/* Display Properties Checklist */}
                <div className="space-y-1.5 border-t border-border pt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Display properties</div>
                  
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={columns.account}
                      onChange={(e) => onColumnsChange({ ...columns, account: e.target.checked })}
                      className="rounded-sm border-border text-primary focus:ring-1 focus:ring-ring size-3.5"
                    />
                    <Building2 className="size-3 text-muted-foreground" />
                    <span>Account</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={columns.amount}
                      onChange={(e) => onColumnsChange({ ...columns, amount: e.target.checked })}
                      className="rounded-sm border-border text-primary focus:ring-1 focus:ring-ring size-3.5"
                    />
                    <DollarSign className="size-3 text-muted-foreground" />
                    <span>Amount</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={columns.owner}
                      onChange={(e) => onColumnsChange({ ...columns, owner: e.target.checked })}
                      className="rounded-sm border-border text-primary focus:ring-1 focus:ring-ring size-3.5"
                    />
                    <UserRound className="size-3 text-muted-foreground" />
                    <span>Owner</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={columns.closeDate}
                      onChange={(e) => onColumnsChange({ ...columns, closeDate: e.target.checked })}
                      className="rounded-sm border-border text-primary focus:ring-1 focus:ring-ring size-3.5"
                    />
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>Close date</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={columns.nextStep}
                      onChange={(e) => onColumnsChange({ ...columns, nextStep: e.target.checked })}
                      className="rounded-sm border-border text-primary focus:ring-1 focus:ring-ring size-3.5"
                    />
                    <List className="size-3 text-muted-foreground" />
                    <span>Next step</span>
                  </label>
                </div>

                {/* Reset display button */}
                <div className="border-t border-border pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDisplay();
                      setDisplayMenuOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline outline-none"
                  >
                    Reset display
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-2 bg-muted/20">
          {selectedStage && (
            <button
              type="button"
              onClick={() => onStageChange('')}
              className="inline-flex items-center gap-1.5 rounded-control bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 outline-none"
            >
              <span>Stage: {stageLabels[selectedStage as any] || selectedStage}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
          {selectedAccount && (
            <button
              type="button"
              onClick={() => onAccountChange('')}
              className="inline-flex items-center gap-1.5 rounded-control bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 outline-none"
            >
              <span>Account: {getAccountName(selectedAccount)}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
          {selectedOwner && (
            <button
              type="button"
              onClick={() => onOwnerChange('')}
              className="inline-flex items-center gap-1.5 rounded-control bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 outline-none"
            >
              <span>Owner: {getOwnerName(selectedOwner)}</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="inline-flex items-center gap-1.5 rounded-control bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 outline-none"
            >
              <span>Search: &quot;{searchQuery}&quot;</span>
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground font-medium pl-1 outline-none"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
