import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Opportunity,
  Account,
  Contact,
  Task,
  RecordList,
  Member,
  Stage,
  Note,
  Activity,
} from '../types/crm';
import {
  initialOpportunities,
  initialAccounts,
  initialContacts,
  initialTasks,
  initialLists,
  initialMembers,
  initialContext,
} from '../data/initialData';
import { useRloe } from './RloeContext';
import {
  deriveAccountsFromInboundLogs,
  deriveOpportunitiesFromInboundLogs,
  deriveTasksFromInboundLogs,
  deriveContactsFromAccounts,
} from '../utils/pipelineAdapter';
import { nexusApi } from '../services/nexusApi';

interface DataContextType {
  opportunities: Opportunity[];
  accounts: Account[];
  contacts: Contact[];
  tasks: Task[];
  lists: RecordList[];
  members: Member[];
  currentUser: Member;
  workspace: { id: string; name: string; slug: string };
  isSyncing: boolean;
  setCurrentUser: (member: Member) => void;
  createOpportunity: (data: Partial<Opportunity>) => Opportunity;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  moveOpportunityStage: (id: string, newStage: Stage) => void;
  addNote: (kind: 'opportunities' | 'accounts' | 'contacts', recordId: string, body: string) => void;
  addToList: (listId: string, recordId: string) => void;
  removeFromList: (listId: string, recordId: string) => void;
  createList: (name: string, recordType: 'opportunities' | 'accounts' | 'contacts') => RecordList;
  createAccount: (data: Partial<Account>) => Account;
  deleteAccount: (id: string) => void;
  createContact: (data: Partial<Contact>) => Contact;
  deleteContact: (id: string) => void;
  createTask: (title: string, dueDate?: string) => Task;
  toggleTaskStatus: (id: string) => void;
  resetData: () => void;
}

// Sanitize helper to guarantee zero mock/demo data leaks into production UI
const isMockName = (str?: string): boolean => {
  if (!str) return false;
  const lower = str.toLowerCase();
  return [
    'brightpath',
    'quarry labs',
    'halcyon',
    'tidewater',
    'orbitline',
    'lumenfield',
    'cedarstone',
    'alex morgan',
    'kestrel',
    'pinegrove',
    'send redlined dpa',
    'prep pricing call',
    'revise brightpath',
    'complete halcyon',
    'follow up with owen',
  ].some((m) => lower.includes(m));
};

const STORAGE_KEY = 'gtm_revops_v5_pure';

// One-time total purge of any legacy demo/seed data from previous versions
try {
  const isPurged = localStorage.getItem('gtm_purged_mock_data_v5');
  if (!isPurged) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !key.includes('theme') && !key.includes('assistant_pos')) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem('gtm_purged_mock_data_v5', 'true');
  }
} catch {
  // localStorage not available or restricted
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_opps`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((o: Opportunity) => !isMockName(o.name)) : [];
      }
      return initialOpportunities;
    } catch {
      return initialOpportunities;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_accs`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((a: Account) => !isMockName(a.name)) : [];
      }
      return initialAccounts;
    } catch {
      return initialAccounts;
    }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_contacts`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((c: Contact) => !isMockName(c.name)) : [];
      }
      return initialContacts;
    } catch {
      return initialContacts;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((t: Task) => !isMockName(t.title)) : [];
      }
      return initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [lists, setLists] = useState<RecordList[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_lists`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter(
              (l: RecordList) =>
                !['q4 commit', 'strategic accounts', 'champions'].includes(l.name.toLowerCase())
            )
          : [];
      }
      return initialLists;
    } catch {
      return initialLists;
    }
  });

  const [members] = useState<Member[]>(initialMembers);
  const [currentUser, setCurrentUser] = useState<Member>(initialContext.user);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const hasMigratedRef = useRef<boolean>(false);

  const { inboundLogs } = useRloe();

  // Phase 6: Load shared CRM data from PostgreSQL on mount and migrate legacy localStorage if needed
  useEffect(() => {
    let isMounted = true;

    async function syncSharedCrmData() {
      setIsSyncing(true);
      try {
        const [remoteAccs, remoteContacts, remoteOpps, remoteTasks, remoteLists] = await Promise.all([
          nexusApi.getCrmAccounts().catch(() => []),
          nexusApi.getCrmContacts().catch(() => []),
          nexusApi.getCrmOpportunities().catch(() => []),
          nexusApi.getCrmTasks().catch(() => []),
          nexusApi.getCrmLists().catch(() => []),
        ]);

        if (!isMounted) return;

        // One-time automatic migration of local records to shared database if local has records and server is empty/partial
        if (!hasMigratedRef.current) {
          hasMigratedRef.current = true;
          const localAccs = accounts.filter((a) => !isMockName(a.name));
          const localOpps = opportunities.filter((o) => !isMockName(o.name));
          const localContacts = contacts.filter((c) => !isMockName(c.name));
          const localTasks = tasks.filter((t) => !isMockName(t.title));
          const localLists = lists.filter((l) => !isMockName(l.name));

          if (
            (localAccs.length > 0 && remoteAccs.length === 0) ||
            (localOpps.length > 0 && remoteOpps.length === 0) ||
            (localTasks.length > 0 && remoteTasks.length === 0)
          ) {
            try {
              await nexusApi.migrateCrmData({
                accounts: localAccs,
                opportunities: localOpps,
                contacts: localContacts,
                tasks: localTasks,
                lists: localLists,
              });
              // Reload fresh records after migration
              const [reloadedAccs, reloadedContacts, reloadedOpps, reloadedTasks, reloadedLists] = await Promise.all([
                nexusApi.getCrmAccounts().catch(() => remoteAccs),
                nexusApi.getCrmContacts().catch(() => remoteContacts),
                nexusApi.getCrmOpportunities().catch(() => remoteOpps),
                nexusApi.getCrmTasks().catch(() => remoteTasks),
                nexusApi.getCrmLists().catch(() => remoteLists),
              ]);
              if (isMounted) {
                if (reloadedAccs.length > 0) setAccounts(reloadedAccs);
                if (reloadedContacts.length > 0) setContacts(reloadedContacts);
                if (reloadedOpps.length > 0) setOpportunities(reloadedOpps);
                if (reloadedTasks.length > 0) setTasks(reloadedTasks);
                if (reloadedLists.length > 0) setLists(reloadedLists);
              }
              return;
            } catch (migErr) {
              console.warn('Automatic CRM data migration skipped or failed:', migErr);
            }
          }
        }

        if (remoteAccs.length > 0) setAccounts(remoteAccs);
        if (remoteContacts.length > 0) setContacts(remoteContacts);
        if (remoteOpps.length > 0) setOpportunities(remoteOpps);
        if (remoteTasks.length > 0) setTasks(remoteTasks);
        if (remoteLists.length > 0) setLists(remoteLists);
      } catch (err) {
        console.warn('Failed to load shared CRM database records, using local cache:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    syncSharedCrmData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize live pipeline data from Supabase inbound_intent_log
  useEffect(() => {
    if (!inboundLogs || inboundLogs.length === 0) return;

    const derivedAccs = deriveAccountsFromInboundLogs(inboundLogs, currentUser);
    const derivedOpps = deriveOpportunitiesFromInboundLogs(inboundLogs, derivedAccs, currentUser);
    const derivedTasks = deriveTasksFromInboundLogs(inboundLogs, derivedAccs, currentUser);
    const derivedContacts = deriveContactsFromAccounts(derivedAccs, currentUser);

    setAccounts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const newItems = derivedAccs.filter((a) => !existingIds.has(a.id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });

    setOpportunities((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const newItems = derivedOpps.filter((o) => !existingIds.has(o.id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });

    setTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newItems = derivedTasks.filter((t) => !existingIds.has(t.id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });

    setContacts((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newItems = derivedContacts.filter((c) => !existingIds.has(c.id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [inboundLogs, currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_opps`, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_accs`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_contacts`, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lists`, JSON.stringify(lists));
  }, [lists]);

  const createOpportunity = (data: Partial<Opportunity>): Opportunity => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newOpp: Opportunity = {
      id: newId,
      name: data.name || 'Untitled Opportunity',
      accountId: data.accountId || '',
      stage: data.stage || 'qualification',
      amount: Number(data.amount) || 0,
      closeDate: data.closeDate || new Date().toISOString().split('T')[0],
      currency: 'USD',
      nextStep: data.nextStep || '',
      owner: data.owner || currentUser,
      contactIds: data.contactIds || [],
      notes: [],
      activity: [
        {
          id: crypto.randomUUID(),
          type: 'created',
          actor: currentUser,
          summary: 'Record created',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setOpportunities((prev) => [newOpp, ...prev]);

    // Asynchronously persist to PostgreSQL
    nexusApi.createCrmOpportunity(newOpp).catch((err) => {
      console.warn('Failed to persist created opportunity to shared database:', err);
    });

    return newOpp;
  };

  const updateOpportunity = (id: string, updates: Partial<Opportunity>) => {
    const now = new Date().toISOString();
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        const updated = {
          ...opp,
          ...updates,
          updatedAt: now,
        };
        return updated;
      })
    );

    // Asynchronously persist to PostgreSQL
    nexusApi.updateCrmOpportunity(id, updates).catch((err) => {
      console.warn('Failed to persist updated opportunity to shared database:', err);
    });
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        recordIds: l.recordIds.filter((rid) => rid !== id),
      }))
    );

    // Asynchronously delete from PostgreSQL
    nexusApi.deleteCrmOpportunity(id).catch((err) => {
      console.warn('Failed to delete opportunity from shared database:', err);
    });
  };

  const moveOpportunityStage = (id: string, newStage: Stage) => {
    const now = new Date().toISOString();
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        if (opp.stage === newStage) return opp;
        const newActivity: Activity = {
          id: crypto.randomUUID(),
          type: 'stage_change',
          actor: currentUser,
          summary: `Stage changed to ${newStage}`,
          createdAt: now,
        };
        return {
          ...opp,
          stage: newStage,
          updatedAt: now,
          activity: [newActivity, ...(opp.activity || [])],
        };
      })
    );

    // Asynchronously update stage in PostgreSQL
    nexusApi.updateCrmOpportunity(id, { stage: newStage }).catch((err) => {
      console.warn('Failed to persist opportunity stage move to shared database:', err);
    });
  };

  const addNote = (kind: 'opportunities' | 'accounts' | 'contacts', recordId: string, body: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      body,
      author: currentUser,
      createdAt: now,
    };

    if (kind === 'opportunities') {
      setOpportunities((prev) =>
        prev.map((opp) => {
          if (opp.id !== recordId) return opp;
          const updatedNotes = [newNote, ...(opp.notes || [])];
          nexusApi.updateCrmOpportunity(recordId, { notes: updatedNotes }).catch(() => {});
          return {
            ...opp,
            notes: updatedNotes,
          };
        })
      );
    } else if (kind === 'accounts') {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== recordId) return acc;
          const updatedNotes = [newNote, ...(acc.notes || [])];
          return {
            ...acc,
            notes: updatedNotes,
          };
        })
      );
    } else if (kind === 'contacts') {
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== recordId) return c;
          const updatedNotes = [newNote, ...(c.notes || [])];
          return {
            ...c,
            notes: updatedNotes,
          };
        })
      );
    }
  };

  const addToList = (listId: string, recordId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        if (l.recordIds.includes(recordId)) return l;
        const updatedIds = [...l.recordIds, recordId];
        nexusApi.updateCrmList(listId, { recordIds: updatedIds }).catch(() => {});
        return {
          ...l,
          recordIds: updatedIds,
        };
      })
    );
  };

  const removeFromList = (listId: string, recordId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const updatedIds = l.recordIds.filter((id) => id !== recordId);
        nexusApi.updateCrmList(listId, { recordIds: updatedIds }).catch(() => {});
        return {
          ...l,
          recordIds: updatedIds,
        };
      })
    );
  };

  const createList = (name: string, recordType: 'opportunities' | 'accounts' | 'contacts') => {
    const newList: RecordList = {
      id: crypto.randomUUID(),
      name,
      recordType,
      recordIds: [],
      createdAt: new Date().toISOString(),
    };
    setLists((prev) => [...prev, newList]);

    nexusApi.createCrmList(newList).catch((err) => {
      console.warn('Failed to persist list to shared database:', err);
    });

    return newList;
  };

  const createAccount = (data: Partial<Account>): Account => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAcc: Account = {
      id: newId,
      name: data.name || 'Untitled Account',
      website: data.website || '',
      industry: data.industry || 'General',
      revenue: Number(data.revenue) || 0,
      headcount: Number(data.headcount) || 0,
      location: data.location || '',
      owner: data.owner || currentUser,
      notes: [],
      activity: [],
      createdAt: now,
      updatedAt: now,
    };
    setAccounts((prev) => [newAcc, ...prev]);

    nexusApi.createCrmAccount(newAcc).catch((err) => {
      console.warn('Failed to persist account to shared database:', err);
    });

    return newAcc;
  };

  const createContact = (data: Partial<Contact>): Contact => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newCon: Contact = {
      id: newId,
      name: data.name || 'Untitled Contact',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || 'Member',
      accountId: data.accountId || '',
      owner: data.owner || currentUser,
      notes: [],
      activity: [],
      createdAt: now,
      updatedAt: now,
    };
    setContacts((prev) => [newCon, ...prev]);

    nexusApi.createCrmContact(newCon).catch((err) => {
      console.warn('Failed to persist contact to shared database:', err);
    });

    return newCon;
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    nexusApi.deleteCrmAccount(id).catch((err) => {
      console.warn('Failed to delete account from shared database:', err);
    });
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));

    nexusApi.deleteCrmContact(id).catch((err) => {
      console.warn('Failed to delete contact from shared database:', err);
    });
  };

  const createTask = (title: string, dueDate?: string): Task => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newTask: Task = {
      id: newId,
      title: title.trim(),
      status: 'todo',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      owner: currentUser,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);

    nexusApi.createCrmTask(newTask).catch((err) => {
      console.warn('Failed to persist task to shared database:', err);
    });

    return newTask;
  };

  const toggleTaskStatus = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const newStatus = task?.status === 'done' ? 'todo' : 'done';

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );

    nexusApi.updateCrmTask(id, { status: newStatus }).catch((err) => {
      console.warn('Failed to persist task status update to shared database:', err);
    });
  };

  const resetData = () => {
    setOpportunities(initialOpportunities);
    setAccounts(initialAccounts);
    setContacts(initialContacts);
    setTasks(initialTasks);
    setLists(initialLists);
    localStorage.clear();
  };

  return (
    <DataContext.Provider
      value={{
        opportunities,
        accounts,
        contacts,
        tasks,
        lists,
        members,
        currentUser,
        workspace: initialContext.workspace,
        isSyncing,
        setCurrentUser,
        createOpportunity,
        updateOpportunity,
        deleteOpportunity,
        moveOpportunityStage,
        addNote,
        addToList,
        removeFromList,
        createList,
        createAccount,
        deleteAccount,
        createContact,
        deleteContact,
        createTask,
        toggleTaskStatus,
        resetData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useCRM must be used within a DataProvider');
  }
  return context;
};
