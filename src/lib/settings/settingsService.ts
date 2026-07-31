import fs from 'fs';
import path from 'path';

// ─── Search Engine Configuration ───
export interface SearchEngineConfig {
  id: string;
  enabled: boolean;
  apiKeys: string;       // comma separated multi-key: "key1,key2,key3"
  extraConfig?: string;  // Google CSE: CX ID, SearXNG: instance URL
}

export interface SystemSettings {
  tavilyApiKeys: string; // legacy backward compat
  providerPriority: string[]; // legacy
  maxSearchLimit: number;
  defaultTargetCount: number;
  searchEngines: SearchEngineConfig[];
}

// ─── Default Engine Registry ───
export const ENGINE_REGISTRY: {
  id: string;
  name: string;
  type: 'api' | 'scraper';
  freeQuota: string;
  needsApiKey: boolean;
  needsExtraConfig?: boolean;
  extraConfigLabel?: string;
  extraConfigPlaceholder?: string;
  warning?: string;
}[] = [
  { id: 'tavily', name: 'Tavily AI Search', type: 'api', freeQuota: '1,000次/月', needsApiKey: true },
  { id: 'serper', name: 'Serper.dev (Google)', type: 'api', freeQuota: '2,500次/月', needsApiKey: true },
  { id: 'google_cse', name: 'Google Custom Search', type: 'api', freeQuota: '100次/天', needsApiKey: true, needsExtraConfig: true, extraConfigLabel: 'CX ID', extraConfigPlaceholder: '搜尋引擎 CX ID' },
  { id: 'bing_api', name: 'Bing Web Search API', type: 'api', freeQuota: '1,000次/月', needsApiKey: true },
  { id: 'exa', name: 'Exa.ai', type: 'api', freeQuota: '1,000次/月', needsApiKey: true },
  { id: 'searxng', name: 'SearXNG (自架)', type: 'api', freeQuota: '無限 (自架)', needsApiKey: false, needsExtraConfig: true, extraConfigLabel: 'Instance URL', extraConfigPlaceholder: 'https://your-searxng-instance.com' },
  { id: 'brave_api', name: 'Brave Search API', type: 'api', freeQuota: '2,000次/月', needsApiKey: true },
  { id: 'yahoo', name: 'Yahoo Search (免費爬蟲)', type: 'scraper', freeQuota: '無限', needsApiKey: false },
  { id: 'duckduckgo', name: 'DuckDuckGo (免費爬蟲)', type: 'scraper', freeQuota: '無限', needsApiKey: false, warning: '雲端 IP 可能被封鎖' },
  { id: 'bing_scraper', name: 'Bing Search (免費爬蟲)', type: 'scraper', freeQuota: '無限', needsApiKey: false, warning: '結果品質可能受限' },
];

function getDefaultEngines(): SearchEngineConfig[] {
  return ENGINE_REGISTRY.map(e => ({
    id: e.id,
    enabled: e.id === 'tavily' || e.id === 'yahoo', // Default: Tavily + Yahoo enabled
    apiKeys: '',
    extraConfig: '',
  }));
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

function getDefaultSettings(): SystemSettings {
  const envKeys = process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || '';
  const envPriority = process.env.SEARCH_PROVIDER_PRIORITY
    ? process.env.SEARCH_PROVIDER_PRIORITY.split(',').map(p => p.trim()).filter(Boolean)
    : ['duckduckgo', 'yahoo', 'tavily', 'googlethis'];

  return {
    tavilyApiKeys: envKeys,
    providerPriority: envPriority,
    maxSearchLimit: 50,
    defaultTargetCount: 100,
    searchEngines: getDefaultEngines(),
  };
}

let inMemorySettings: SystemSettings | null = null;

export function getSystemSettings(): SystemSettings {
  if (inMemorySettings) {
    return inMemorySettings;
  }

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Merge saved engines with registry to handle new engines added after save
      let engines = parsed.searchEngines || getDefaultEngines();
      const savedIds = new Set(engines.map((e: SearchEngineConfig) => e.id));
      for (const reg of ENGINE_REGISTRY) {
        if (!savedIds.has(reg.id)) {
          engines.push({ id: reg.id, enabled: false, apiKeys: '', extraConfig: '' });
        }
      }

      // Backward compat: if tavilyApiKeys was set but searchEngines[tavily].apiKeys is empty
      const tavilyEngine = engines.find((e: SearchEngineConfig) => e.id === 'tavily');
      if (tavilyEngine && !tavilyEngine.apiKeys && parsed.tavilyApiKeys) {
        tavilyEngine.apiKeys = parsed.tavilyApiKeys;
        tavilyEngine.enabled = true;
      }

      inMemorySettings = {
        ...getDefaultSettings(),
        ...parsed,
        searchEngines: engines,
      };
      return inMemorySettings!;
    }
  } catch (error) {
    console.error('Failed to read settings file:', error);
  }

  inMemorySettings = getDefaultSettings();
  return inMemorySettings;
}

export function updateSystemSettings(newSettings: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...newSettings,
  };

  // Sync legacy tavilyApiKeys with searchEngines
  if (newSettings.searchEngines) {
    const tavily = newSettings.searchEngines.find(e => e.id === 'tavily');
    if (tavily) {
      updated.tavilyApiKeys = tavily.apiKeys;
    }
  }

  inMemorySettings = updated;

  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write settings file:', error);
  }

  return updated;
}
