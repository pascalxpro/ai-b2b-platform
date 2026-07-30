import { SearchCriteria, SearchTask, SearchResult, SearchSource, CostEstimate } from '@/lib/providers/types';
import { mockProvider } from '@/lib/providers/mock-provider';
import { searchStore } from './store';

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class SearchEngine {
  private cancellationTokens: Set<string> = new Set();

  async createTask(name: string, criteria: SearchCriteria): Promise<SearchTask> {
    const estimate = await mockProvider.estimateCost(criteria);
    const task: SearchTask = {
      id: generateId(),
      name,
      status: 'QUEUED',
      criteria,
      targetCount: criteria.targetCount || 50,
      foundCount: 0,
      validCount: 0,
      duplicateCount: 0,
      progress: 0,
      estimatedCost: estimate.estimatedCost,
      actualCost: 0,
      createdAt: new Date().toISOString(),
    };
    return searchStore.createTask(task);
  }

  async executeTask(taskId: string): Promise<void> {
    const task = searchStore.getTask(taskId);
    if (!task) throw new Error('Task not found');

    searchStore.updateTask(taskId, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });
    this.cancellationTokens.delete(taskId);

    try {
      let foundCount = 0;
      let duplicateCount = 0;
      const targetCount = task.targetCount || 50;

      const generator = mockProvider.search(task.criteria);

      for await (const batch of generator) {
        if (this.cancellationTokens.has(taskId)) {
          searchStore.updateTask(taskId, { status: 'CANCELLED' });
          return;
        }

        const processed = this.processResults(taskId, batch);
        searchStore.addResults(processed);

        foundCount += processed.length;
        duplicateCount += processed.filter(r => r.qualityStatus === 'DUPLICATE').length;
        const progress = Math.min(100, Math.round((foundCount / targetCount) * 100));

        searchStore.updateTask(taskId, {
          progress,
          foundCount,
          duplicateCount,
          validCount: foundCount - duplicateCount,
          actualCost: foundCount * 0.02,
        });
      }

      searchStore.updateTask(taskId, {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      searchStore.updateTask(taskId, {
        status: 'FAILED',
        error: error.message || 'Unknown error',
      });
    }
  }

  cancelTask(taskId: string): void {
    this.cancellationTokens.add(taskId);
  }

  async estimateCost(criteria: SearchCriteria): Promise<CostEstimate> {
    return mockProvider.estimateCost(criteria);
  }

  private processResults(taskId: string, items: any[]): SearchResult[] {
    return items.map(item => {
      const duplicate = searchStore.findDuplicate(item.companyName, item.website);
      const isDuplicate = !!duplicate;
      const qualityScore = this.calculateQualityScore(item);

      const source: SearchSource = {
        id: generateId(),
        provider: 'mock',
        sourceUrl: item.sourceUrl || '',
        sourceType: item.sourceType || 'web_search',
        confidence: item.confidence || 50,
        capturedAt: item.capturedAt || new Date().toISOString(),
      };

      const result: SearchResult = {
        id: generateId(),
        taskId,
        companyName: item.companyName,
        companyNameLocal: item.companyNameLocal,
        country: item.country,
        city: item.city,
        industry: item.industry,
        companyType: item.companyType,
        website: item.website,
        email: item.email,
        phone: item.phone,
        linkedIn: item.linkedIn,
        description: item.description,
        employeeCount: item.employeeCount,
        revenue: item.revenue,
        revenueCurrency: item.revenueCurrency || 'USD',
        sourceCount: 1,
        sources: [source],
        qualityStatus: isDuplicate ? 'DUPLICATE' : 'NEW',
        qualityScore,
        conversionStatus: 'NONE',
        duplicateKey: searchStore.generateDuplicateKey(item.companyName, item.website),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return result;
    });
  }

  private calculateQualityScore(item: any): number {
    let score = 30;

    // Confidence base (0-100)
    if (item.confidence) score += Math.round(item.confidence * 0.3);

    // Data completeness bonuses
    if (item.website) score += 8;
    if (item.email) score += 8;
    if (item.phone) score += 5;
    if (item.description) score += 6;
    if (item.employeeCount) score += 5;
    if (item.revenue) score += 5;
    if (item.linkedIn) score += 3;

    return Math.min(100, score);
  }
}

export const searchEngine = new SearchEngine();
