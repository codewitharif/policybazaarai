export interface Policy {
  id: string;
  category: 'Health' | 'Life' | 'Motor' | 'Travel';
  name: string;
  provider: string;
  premium: string;
  coverage: string;
  features: string[];
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  policyCategory: string;
  policyName: string;
  status: 'New' | 'Contacted' | 'Closed';
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  activePolicies: number;
  conversionRate: string;
  leadsThisMonth: number;
}

export interface AnalyticsData {
  weeklyEngagement: { day: string; count: number }[];
  leadsByCategory: { category: string; count: number; color: string }[];
  leadsByStatus: { status: string; count: number; color: string }[];
}

export const POLICIES: Policy[] = [
  {
    id: 'h1',
    category: 'Health',
    name: 'Family Health Optima',
    provider: 'Star Health',
    premium: '₹12,500/year',
    coverage: '₹5,00,000',
    features: ['Cashless Treatment', 'No Pre-policy Checkup', 'Free Health Checkup'],
    description: 'Comprehensive health coverage for your entire family with extensive hospital network.'
  },
  {
    id: 'h2',
    category: 'Health',
    name: 'Niva Bupa ReAssure',
    provider: 'Niva Bupa',
    premium: '₹14,200/year',
    coverage: '₹10,00,000',
    features: ['ReAssure Benefit', 'Modern Treatment Cover', 'Hospital Cash'],
    description: 'Smart health plan that refills your sum insured as many times as you need.'
  },
  {
    id: 'l1',
    category: 'Life',
    name: 'ICICI Pru iProtect Smart',
    provider: 'ICICI Prudential',
    premium: '₹8,500/year',
    coverage: '₹1,00,00,000',
    features: ['Critical Illness Cover', 'Accidental Death Benefit', 'Terminal Illness Cover'],
    description: 'High coverage term life insurance at affordable rates with optional riders.'
  },
  {
    id: 'l2',
    category: 'Life',
    name: 'HDFC Life Click 2 Protect',
    provider: 'HDFC Life',
    premium: '₹9,200/year',
    coverage: '₹1,00,00,000',
    features: ['Flexible Pay-outs', 'Income Option', 'Waiver of Premium'],
    description: 'A flexible term plan that evolves with your changing life needs.'
  },
  {
    id: 'm1',
    category: 'Motor',
    name: 'Comprehensive Car Insurance',
    provider: 'Bajaj Allianz',
    premium: '₹6,800/year',
    coverage: 'IDV based',
    features: ['Zero Depreciation', '24/7 Roadside Assistance', 'Engine Protector'],
    description: 'All-round protection for your car against accidents, theft, and natural disasters.'
  },
  {
    id: 't1',
    category: 'Travel',
    name: 'Explore Travel Insurance',
    provider: 'Religare',
    premium: '₹1,200/trip',
    coverage: '$50,000',
    features: ['Emergency Medical', 'Trip Cancellation', 'Loss of Passport'],
    description: 'International travel insurance covering medical and non-medical emergencies.'
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    phone: '+91 98765 43210',
    policyCategory: 'Health',
    policyName: 'Family Health Optima',
    status: 'New',
    createdAt: '2026-04-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.p@example.com',
    phone: '+91 87654 32109',
    policyCategory: 'Life',
    policyName: 'ICICI Pru iProtect Smart',
    status: 'Contacted',
    createdAt: '2026-04-14T14:45:00Z'
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.k@example.com',
    phone: '+91 76543 21098',
    policyCategory: 'Motor',
    policyName: 'Comprehensive Car Insurance',
    status: 'New',
    createdAt: '2026-04-16T09:15:00Z'
  },
  {
    id: '4',
    name: 'Sneha Gupta',
    email: 'sneha.g@example.com',
    phone: '+91 99887 76655',
    policyCategory: 'Health',
    policyName: 'Niva Bupa ReAssure',
    status: 'Closed',
    createdAt: '2026-04-10T11:20:00Z'
  },
  {
    id: '5',
    name: 'Vikram Singh',
    email: 'vikram.s@example.com',
    phone: '+91 88776 65544',
    policyCategory: 'Travel',
    policyName: 'Explore Travel Insurance',
    status: 'New',
    createdAt: '2026-04-16T12:00:00Z'
  },
  {
    id: '6',
    name: 'Anjali Desai',
    email: 'anjali.d@example.com',
    phone: '+91 77665 54433',
    policyCategory: 'Life',
    policyName: 'HDFC Life Click 2 Protect',
    status: 'Contacted',
    createdAt: '2026-04-12T16:30:00Z'
  }
];

export const DASHBOARD_STATS: DashboardStats = {
  totalLeads: 124,
  activePolicies: 48,
  conversionRate: '12.5%',
  leadsThisMonth: 32
};

export const ANALYTICS_DATA: AnalyticsData = {
  weeklyEngagement: [
    { day: 'Mon', count: 42 },
    { day: 'Tue', count: 58 },
    { day: 'Wed', count: 45 },
    { day: 'Thu', count: 62 },
    { day: 'Fri', count: 75 },
    { day: 'Sat', count: 35 },
    { day: 'Sun', count: 28 },
  ],
  leadsByCategory: [
    { category: 'Health', count: 45, color: '#10B981' },
    { category: 'Life', count: 32, color: '#059669' },
    { category: 'Motor', count: 28, color: '#F97316' },
    { category: 'Travel', count: 19, color: '#8B5CF6' },
  ],
  leadsByStatus: [
    { status: 'New', count: 54, color: '#3B82F6' },
    { status: 'Contacted', count: 42, color: '#F59E0B' },
    { status: 'Closed', count: 28, color: '#10B981' },
  ]
};
