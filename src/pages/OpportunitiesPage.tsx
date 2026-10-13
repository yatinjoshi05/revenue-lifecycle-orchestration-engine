import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/DataContext';
import { Stage, ViewMode } from '../types/crm';
import { filterAndSortOpportunities } from '../utils/format';
import { Header } from '../components/Header';
import { Toolbar, DisplayColumns } from '../components/Toolbar';
import { OpportunityTable } from '../components/OpportunityTable';
import { OpportunityBoard } from '../components/OpportunityBoard';
import { OpportunityDrawer } from '../components/OpportunityDrawer';
import { CreateOpportunityModal } from '../components/CreateOpportunityModal';

interface OpportunitiesPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { opportunities, accounts } = useCRM();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search params state
  const viewMode: ViewMode = (searchParams.get('view') as ViewMode) || 'board';
  const searchQuery = searchParams.get('q') || '';
  const selectedStage = searchParams.get('stage') || '';
  const selectedAccount = searchParams.get('account') || '';
  const selectedOwner = searchParams.get('owner') || '';
  const sortField = searchParams.get('sort') || 'name';
  const sortDirection = (searchParams.get('direction') as 'asc' | 'desc') || 'asc';
  const selectedRecordId = searchParams.get('record') || undefined;

  // Display columns visibility state
  const [columns, setColumns] = useState<DisplayColumns>({
    account: true,
    amount: true,
    owner: true,
    closeDate: true,
    nextStep: false,
  });

  // Create Opportunity modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialStage, setCreateInitialStage] = useState<Stage>('qualification');

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    const next = new URLSearchParams();
    if (viewMode !== 'board') next.set('view', viewMode);
    setSearchParams(next);
  };

  const handleResetDisplay = () => {
    setColumns({
      account: true,
      amount: true,
      owner: true,
      closeDate: true,
      nextStep: false,
    });
    const next = new URLSearchParams(searchParams);
    next.delete('sort');
    next.delete('direction');
    setSearchParams(next);
  };

  const handleOpenCreate = (stage: Stage = 'qualification') => {
    setCreateInitialStage(stage);
    setCreateModalOpen(true);
  };

  const handleSelectRecord = (id: string) => {
    updateParam('record', id);
  };

  const handleCloseDrawer = () => {
    updateParam('record', '');
  };

  const handleOpenFullPage = (id: string) => {
    navigate(`/opportunities/${id}`);
  };

  // Filtered & sorted opportunities
  const filteredOpps = filterAndSortOpportunities(opportunities, accounts, {
    q: searchQuery,
    stage: selectedStage,
    account: selectedAccount,
    owner: selectedOwner,
    sort: sortField,
    direction: sortDirection,
  });

  const selectedOpp = opportunities.find((o) => o.id === selectedRecordId);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden relative">
      {/* Top Header Bar */}
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Opportunities"
        icon="opportunities"
        onOpenCreate={() => handleOpenCreate('qualification')}
        createLabel="Create opportunity"
        onOpenSettings={onOpenSettings}
      />

      {/* Toolbar (Filters, Search, View switch, Display options) */}
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={(m) => updateParam('view', m)}
        searchQuery={searchQuery}
        onSearchChange={(q) => updateParam('q', q)}
        selectedStage={selectedStage}
        onStageChange={(s) => updateParam('stage', s)}
        selectedAccount={selectedAccount}
        onAccountChange={(a) => updateParam('account', a)}
        selectedOwner={selectedOwner}
        onOwnerChange={(o) => updateParam('owner', o)}
        sortField={sortField}
        onSortFieldChange={(f) => updateParam('sort', f)}
        sortDirection={sortDirection}
        onSortDirectionChange={(d) => updateParam('direction', d)}
        columns={columns}
        onColumnsChange={setColumns}
        onResetDisplay={handleResetDisplay}
        onClearFilters={handleClearFilters}
      />

      {/* Main Content: Table or Board */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {viewMode === 'table' ? (
          <OpportunityTable
            opportunities={filteredOpps}
            accounts={accounts}
            selectedId={selectedRecordId}
            onSelect={handleSelectRecord}
            onOpenFullPage={handleOpenFullPage}
            columns={columns}
            sortField={sortField}
            onSort={(f) => {
              if (sortField === f) {
                updateParam('direction', sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                const next = new URLSearchParams(searchParams);
                next.set('sort', f);
                next.set('direction', 'asc');
                setSearchParams(next);
              }
            }}
            sortDirection={sortDirection}
          />
        ) : (
          <OpportunityBoard
            opportunities={filteredOpps}
            accounts={accounts}
            selectedId={selectedRecordId}
            onSelect={handleSelectRecord}
            onOpenFullPage={handleOpenFullPage}
            onCreateInStage={handleOpenCreate}
            columns={columns}
          />
        )}

        {/* Opportunity Detail Drawer (when a record is selected) */}
        {selectedOpp && (
          <OpportunityDrawer
            opportunity={selectedOpp}
            onClose={handleCloseDrawer}
            onOpenFullPage={handleOpenFullPage}
          />
        )}
      </div>

      {/* Create Opportunity Modal Dialog */}
      <CreateOpportunityModal
        open={createModalOpen}
        initialStage={createInitialStage}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newOpp) => {
          handleSelectRecord(newOpp.id);
        }}
      />
    </div>
  );
};
