// Search criteria for building queries
export interface SearchCriteria {
  queryText?: string;
  countries?: string[];
  industries?: string[];
  companyTypes?: string[];
  keywords?: string[];
  targetCount?: number;
  revenueRange?: { min?: number; max?: number };
  employeeRange?: { min?: number; max?: number };
}

// Individual search result item from a provider
export interface SearchResultItem {
  id: string;
  companyName: string;
  companyNameLocal?: string;  // Local language name
  country: string;
  city?: string;
  industry: string;
  companyType: string;  // manufacturer, distributor, agent, importer
  website?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  description?: string;
  employeeCount?: number;
  revenue?: number;
  revenueCurrency?: string;
  sourceUrl: string;
  sourceType: string;  // web_search, linkedin, trade_directory, company_db
  confidence: number;  // 0-100
  capturedAt: string;  // ISO date
}

// Search task status
export type SearchTaskStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Quality status for results
export type QualityStatus = 'NEW' | 'VALID' | 'PENDING_REVIEW' | 'DUPLICATE' | 'INVALID';

// Conversion status
export type ConversionStatus = 'NONE' | 'FAVORITED' | 'ASSIGNED' | 'CONVERTED_LEAD';

// Search task
export interface SearchTask {
  id: string;
  name: string;
  status: SearchTaskStatus;
  criteria: SearchCriteria;
  targetCount: number;
  foundCount: number;
  validCount: number;
  duplicateCount: number;
  progress: number;  // 0-100
  estimatedCost: number;
  actualCost: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Search result (processed)
export interface SearchResult {
  id: string;
  taskId: string;
  companyName: string;
  companyNameLocal?: string;
  country: string;
  city?: string;
  industry: string;
  companyType: string;
  website?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  description?: string;
  employeeCount?: number;
  revenue?: number;
  revenueCurrency?: string;
  sourceCount: number;
  sources: SearchSource[];
  qualityStatus: QualityStatus;
  qualityScore: number;  // 0-100
  conversionStatus: ConversionStatus;
  duplicateKey?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchSource {
  id: string;
  provider: string;
  sourceUrl: string;
  sourceType: string;
  confidence: number;
  capturedAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  createdAt: string;
  lastRunAt?: string;
  resultCount?: number;
}

export interface CostEstimate {
  estimatedResults: number;
  estimatedCost: number;
  estimatedTime: number;  // seconds
  currency: string;
}

// Provider interface
export interface SearchProvider {
  id: string;
  name: string;
  search(criteria: SearchCriteria): AsyncGenerator<SearchResultItem[], void, unknown>;
  estimateCost(criteria: SearchCriteria): Promise<CostEstimate>;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter params for results
export interface ResultsFilter {
  taskId?: string;
  qualityStatus?: QualityStatus[];
  conversionStatus?: ConversionStatus[];
  countries?: string[];
  industries?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
