import React from 'react';
import { CheckCircle2, Handshake, Building2, ListTodo, Plus, ArrowRight } from 'lucide-react';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';
import { formatMoney } from '../utils/format';
import { Link } from 'react-router-dom';

interface UpNextPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const UpNextPage: React.FC<UpNextPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { opportunities, accounts, tasks, currentUser } = useCRM();

  const closingSoon = opportunities.slice(0, 5);
  const pendingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5);
  const totalPipeline = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Home"
        onOpenSettings={onOpenSettings}
      />

      <div className="max-w-4xl mx-auto w-full p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Operations Workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time status of your active pipeline, accounts under management, and pending action items.
          </p>
        </div>

        {/* Real Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground block font-medium">Active Opportunities</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{opportunities.length}</span>
              <span className="text-xs text-muted-foreground">({formatMoney(totalPipeline)})</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground block font-medium">Accounts Under Management</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{accounts.length}</span>
              <span className="text-xs text-muted-foreground">accounts</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground block font-medium">Open Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{pendingTasks.length}</span>
              <span className="text-xs text-muted-foreground">pending items</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority Opportunities */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Handshake className="size-4 text-blue-500" />
                <span>Priority Opportunities</span>
              </div>
              <Link to="/opportunities" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {closingSoon.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                <p>No opportunities created yet.</p>
                <Link
                  to="/opportunities"
                  className="mt-2 inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  <Plus className="size-3" />
                  <span>Create an opportunity</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {closingSoon.map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/opportunities/${opp.id}`}
                    className="flex items-center justify-between py-2 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-medium text-foreground truncate max-w-[200px]">{opp.name}</span>
                    <span className="tabular-nums font-semibold text-foreground">{formatMoney(opp.amount)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Upcoming Tasks</span>
              </div>
              <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                <p>No open tasks scheduled.</p>
                <Link
                  to="/tasks"
                  className="mt-2 inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  <Plus className="size-3" />
                  <span>Create a task</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-foreground truncate max-w-[220px]">{t.title}</span>
                    <span className="text-[11px] text-muted-foreground">{t.dueDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpNextPage;
