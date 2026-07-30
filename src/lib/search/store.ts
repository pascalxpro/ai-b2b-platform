import { SearchTask, SearchResult, SavedSearch, ResultsFilter, PaginatedResponse } from '@/lib/providers/types';

class SearchStore {
  private tasks: Map<string, SearchTask> = new Map();
  private results: Map<string, SearchResult> = new Map();
  private savedSearches: Map<string, SavedSearch> = new Map();

  // Tasks
  createTask(task: SearchTask): SearchTask {
    this.tasks.set(task.id, task);
    return task;
  }

  getTask(id: string): SearchTask | undefined {
    return this.tasks.get(id);
  }

  listTasks(filter?: { status?: string }): SearchTask[] {
    const allTasks = Array.from(this.tasks.values());
    if (filter?.status) {
      return allTasks.filter(t => t.status === filter.status);
    }
    return allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateTask(id: string, updates: Partial<SearchTask>): SearchTask | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  // Results
  addResult(result: SearchResult): SearchResult {
    this.results.set(result.id, result);
    return result;
  }

  addResults(results: SearchResult[]): void {
    for (const result of results) {
      this.results.set(result.id, result);
    }
  }

  getResult(id: string): SearchResult | undefined {
    return this.results.get(id);
  }

  listResults(filter: ResultsFilter): PaginatedResponse<SearchResult> {
    let filtered = Array.from(this.results.values());

    if (filter.taskId) {
      filtered = filtered.filter(r => r.taskId === filter.taskId);
    }
    if (filter.qualityStatus && filter.qualityStatus.length > 0) {
      filtered = filtered.filter(r => filter.qualityStatus!.includes(r.qualityStatus));
    }
    if (filter.conversionStatus && filter.conversionStatus.length > 0) {
      filtered = filtered.filter(r => filter.conversionStatus!.includes(r.conversionStatus));
    }
    if (filter.countries && filter.countries.length > 0) {
      filtered = filtered.filter(r => filter.countries!.includes(r.country));
    }
    if (filter.industries && filter.industries.length > 0) {
      filtered = filtered.filter(r => filter.industries!.includes(r.industry));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.companyName.toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q) ||
        (r.industry || '').toLowerCase().includes(q) ||
        (r.companyNameLocal || '').toLowerCase().includes(q)
      );
    }

    if (filter.sortBy) {
      filtered.sort((a, b) => {
        const valA: any = (a as any)[filter.sortBy!];
        const valB: any = (b as any)[filter.sortBy!];

        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return filter.sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        if (valA < valB) return filter.sortOrder === 'desc' ? 1 : -1;
        if (valA > valB) return filter.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 25;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages };
  }

  updateResult(id: string, updates: Partial<SearchResult>): SearchResult | undefined {
    const result = this.results.get(id);
    if (!result) return undefined;
    const updated = { ...result, ...updates };
    this.results.set(id, updated);
    return updated;
  }

  batchUpdateResults(ids: string[], updates: Partial<SearchResult>): number {
    let count = 0;
    for (const id of ids) {
      if (this.updateResult(id, { ...updates, updatedAt: new Date().toISOString() })) {
        count++;
      }
    }
    return count;
  }

  // Saved Searches
  createSavedSearch(search: SavedSearch): SavedSearch {
    this.savedSearches.set(search.id, search);
    return search;
  }

  listSavedSearches(): SavedSearch[] {
    return Array.from(this.savedSearches.values());
  }

  // Deduplication
  generateDuplicateKey(companyName: string, website?: string): string {
    let key = companyName.toLowerCase().trim();
    key = key.replace(/\s+(co\.|ltd\.|inc\.|gmbh|llc|corp\.|corporation|limited|有限公司|株式会社)$/gi, '');
    if (website) {
      key += '|' + website.toLowerCase().trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
    return key;
  }

  findDuplicate(companyName: string, website?: string): SearchResult | undefined {
    const targetKey = this.generateDuplicateKey(companyName, website);
    for (const result of this.results.values()) {
      const key = this.generateDuplicateKey(result.companyName, result.website);
      if (key === targetKey) {
        return result;
      }
    }
    return undefined;
  }
}

export const searchStore = new SearchStore();
