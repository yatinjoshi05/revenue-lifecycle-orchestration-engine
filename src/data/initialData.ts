import { Account, Contact, Opportunity, Task, RecordList, UserContext, Member } from '../types/crm';

export const initialContext: UserContext = {
  user: {
    id: '6c7138af-bc42-4530-bc96-ff7255759a65',
    name: 'Operator',
    email: 'operator@revops.internal',
    image: null,
  },
  workspace: {
    id: 'db2a6fca-2397-43ed-814b-3f46f25459d1',
    name: 'RevOps Operations',
    slug: 'operations',
  },
  role: 'owner',
};

export const initialMembers: Member[] = [
  {
    id: '6c7138af-bc42-4530-bc96-ff7255759a65',
    name: 'Operator',
    email: 'operator@revops.internal',
  },
];

// Production-ready real data bindings — zero hardcoded fake or demo business records
export const initialOpportunities: Opportunity[] = [];
export const initialAccounts: Account[] = [];
export const initialContacts: Contact[] = [];
export const initialTasks: Task[] = [];
export const initialLists: RecordList[] = [];
