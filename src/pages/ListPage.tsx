import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';
import { formatMoney, formatCloseDate } from '../utils/format';

interface ListPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const ListPage: React.FC<ListPageProps> = ({ onToggleMobileSidebar, onOpenSettings }) => {
  const { id } = useParams<{ id: string }>();
  const { lists, opportunities, accounts, contacts } = useCRM();

  const list = lists.find((l) => l.id === id);

  if (!list) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <Header onToggleMobileSidebar={onToggleMobileSidebar} title="List not found" onOpenSettings={onOpenSettings} />
        <div className="p-8 text-center text-sm text-muted-foreground">List not found.</div>
      </div>
    );
  }

  let records: any[] = [];
  if (list.recordType === 'opportunities') {
    records = opportunities.filter((o) => list.recordIds.includes(o.id));
  } else if (list.recordType === 'accounts') {
    records = accounts.filter((a) => list.recordIds.includes(a.id));
  } else if (list.recordType === 'contacts') {
    records = contacts.filter((c) => list.recordIds.includes(c.id));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title={list.name}
        icon={list.recordType as any}
        onOpenSettings={onOpenSettings}
      />

      <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-border px-6 py-2">
        <div className="text-xs text-muted-foreground capitalize">
          {list.recordType} list ({records.length} items)
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-5xl">
        <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
          {records.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              This list is empty. Add records from the 3-dots menu on any record.
            </div>
          ) : (
            records.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-medium text-foreground truncate">{rec.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {rec.email || rec.website || (rec.amount ? formatMoney(rec.amount) : '')}
                  </div>
                </div>
                {rec.stage && (
                  <span className="capitalize px-2 py-0.5 rounded-sm bg-muted text-[11px] text-muted-foreground font-medium">
                    {rec.stage}
                  </span>
                )}
                {rec.role && <span className="text-[11px] text-muted-foreground">{rec.role}</span>}
                {rec.industry && <span className="text-[11px] text-muted-foreground">{rec.industry}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
