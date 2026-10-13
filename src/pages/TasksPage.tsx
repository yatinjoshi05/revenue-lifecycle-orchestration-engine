import React, { useState } from 'react';
import { ListTodo, CheckSquare, Square, Calendar, Plus, X } from 'lucide-react';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';

interface TasksPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
}) => {
  const { tasks, createTask, toggleTaskStatus } = useCRM();
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTask(newTitle.trim(), newDueDate);
    setNewTitle('');
    setNewDueDate('');
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title="Tasks"
        icon="tasks"
        onOpenCreate={() => setModalOpen(true)}
        createLabel="Create task"
        onOpenSettings={onOpenSettings}
      />

      <div className="flex-1 overflow-auto p-6 max-w-4xl">
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border/80 rounded-xl bg-card/40 p-8">
              <CheckSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground mt-1">Action items and operational follow-ups will appear here.</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <Plus className="size-3.5" />
                <span>Create task</span>
              </button>
            </div>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer ${
                    isDone ? 'opacity-60' : ''
                  }`}
                >
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    {isDone ? <CheckSquare className="size-4 text-emerald-600" /> : <Square className="size-4" />}
                  </button>
                  <span className={`text-xs sm:text-sm font-medium flex-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>{task.dueDate}</span>
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{task.owner?.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Create task</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-3 outline-none focus:border-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Due date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 w-full rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-8 rounded-control border border-border px-3 text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-control bg-primary text-primary-foreground px-4 text-xs font-medium hover:bg-primary/90"
                >
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
