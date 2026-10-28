import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface DataContextType {
  opportunities: Opportunity[];
  accounts: Account[];
  contacts: Contact[];
  tasks: Task[];
  lists: RecordList[];
  members: Member[];
  currentUser: Member;
  workspace: { id: string; name: string; slug: string };
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
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    // also remove from lists
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        recordIds: l.recordIds.filter((rid) => rid !== id),
      }))
    );
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
          return {
            ...opp,
            notes: [newNote, ...(opp.notes || [])],
          };
        })
      );
    } else if (kind === 'accounts') {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== recordId) return acc;
          return {
            ...acc,
            notes: [newNote, ...(acc.notes || [])],
          };
        })
      );
    } else if (kind === 'contacts') {
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== recordId) return c;
          return {
            ...c,
            notes: [newNote, ...(c.notes || [])],
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
        return {
          ...l,
          recordIds: [...l.recordIds, recordId],
        };
      })
    );
  };

  const removeFromList = (listId: string, recordId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          recordIds: l.recordIds.filter((id) => id !== recordId),
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
    return newCon;
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
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
    return newTask;
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done', updatedAt: new Date().toISOString() }
          : t
      )
    );
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
