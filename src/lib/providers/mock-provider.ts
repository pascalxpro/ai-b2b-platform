import { SearchProvider, SearchCriteria, SearchResultItem, CostEstimate } from './types';
import { 
  generateCompanyName, 
  generateMockEmail, 
  generateMockWebsite, 
  generateMockPhone, 
  generateMockDescription, 
  generateCity,
  randomFromArray, 
  randomBetween, 
  generateId 
} from './mock-data';

export class MockSearchProvider implements SearchProvider {
  id = 'mock';
  name = 'Mock Search Engine';

  async *search(criteria: SearchCriteria): AsyncGenerator<SearchResultItem[], void, unknown> {
    const targetCount = criteria.targetCount || 50;
    const batchSize = 5;
    const countries = criteria.countries?.length ? criteria.countries : ['Japan', 'Germany', 'USA'];
    const industries = criteria.industries?.length ? criteria.industries : ['Food Packaging'];
    
    let generated = 0;
    while (generated < targetCount) {
      // Simulate network delay (200-800ms per batch)
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600));
      
      const batch: SearchResultItem[] = [];
      const currentBatchSize = Math.min(batchSize, targetCount - generated);
      
      for (let i = 0; i < currentBatchSize; i++) {
        const country = randomFromArray(countries);
        const industry = randomFromArray(industries);
        const companyType = randomFromArray(criteria.companyTypes || ['manufacturer', 'distributor', 'agent']);
        const { name, localName } = generateCompanyName(country, industry);
        
        batch.push({
          id: generateId(),
          companyName: name,
          companyNameLocal: localName,
          country,
          city: generateCity(country),
          industry,
          companyType,
          website: generateMockWebsite(name),
          email: generateMockEmail(name),
          phone: generateMockPhone(country),
          description: generateMockDescription(industry, companyType),
          employeeCount: randomBetween(10, 5000),
          revenue: randomBetween(100000, 50000000),
          revenueCurrency: 'USD',
          sourceUrl: `https://example.com/company/${generateId().slice(0, 8)}`,
          sourceType: randomFromArray(['web_search', 'trade_directory', 'company_db', 'linkedin']),
          confidence: randomBetween(45, 98),
          capturedAt: new Date().toISOString(),
        });
      }
      
      generated += batch.length;
      yield batch;
    }
  }

  async estimateCost(criteria: SearchCriteria): Promise<CostEstimate> {
    const count = criteria.targetCount || 50;
    return {
      estimatedResults: count,
      estimatedCost: count * 0.02,
      estimatedTime: Math.ceil(count / 5) * 0.5,
      currency: 'USD',
    };
  }
}

export const mockProvider = new MockSearchProvider();
