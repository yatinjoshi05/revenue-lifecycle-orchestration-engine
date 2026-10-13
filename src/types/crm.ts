export type Stage = 'qualification' | 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const stages: Stage[] = ['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];

export const stageLabels: Record<Stage, string> = {
  qualification: 'Qualification',
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export interface Member {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
}

export interface Note {
  id: string;
  body?: string;
  content?: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  stage: Stage;
  amount: number;
  closeDate: string;
  currency: string;
  nextStep: string;
  owner: {
    id: string;
    name: string;
    email?: string;
  };
  contactIds: string[];
  notes: Note[];
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  website: string;
  industry: string;
  revenue: number;
  headcount: number;
  location: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  owner: {
    id: string;
    name: string;
    email?: string;
  };
  notes: Note[];
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountId: string;
  owner: {
    id: string;
    name: string;
    email?: string;
  };
  notes: Note[];
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'open' | 'completed' | 'in_progress' | 'todo' | 'done' | string;
  dueDate: string;
  owner?: {
    id: string;
    name: string;
    email?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email?: string;
  };
  notes?: Note[];
  activity?: Activity[];
  relatedRecords?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface RecordList {
  id: string;
  name: string;
  recordType: 'opportunities' | 'accounts' | 'contacts';
  recordIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserContext {
  user: Member;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
}

export type ViewMode = 'table' | 'board';
