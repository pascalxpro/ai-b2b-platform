import { prisma } from '@/lib/db/prisma';

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

const SETTINGS_DB_KEY = 'system_settings';

function getDefaultEngines(): SearchEngineConfig[] {
  return ENGINE_REGISTRY.map(e => ({
    id: e.id,
    enabled: e.id === 'tavily' || e.id === 'yahoo',
    apiKeys: '',
    extraConfig: '',
  }));
}

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

// In-memory cache to avoid DB read on every request
let inMemorySettings: SystemSettings | null = null;

function mergeEnginesWithRegistry(engines: SearchEngineConfig[]): SearchEngineConfig[] {
  const savedIds = new Set(engines.map(e => e.id));
  const merged = [...engines];
  for (const reg of ENGINE_REGISTRY) {
    if (!savedIds.has(reg.id)) {
      merged.push({ id: reg.id, enabled: false, apiKeys: '', extraConfig: '' });
    }
  }
  return merged;
}

// ─── Read settings (sync, from cache; async loader below) ───
export function getSystemSettings(): SystemSettings {
  if (inMemorySettings) {
    return inMemorySettings;
  }
  // Return defaults if cache not loaded yet
  // The async loader will populate it
  return getDefaultSettings();
}

// ─── Async loader: reads from DB ───
export async function loadSettingsFromDb(): Promise<SystemSettings> {
  if (inMemorySettings) return inMemorySettings;

  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_DB_KEY },
    });

    if (row) {
      const parsed = JSON.parse(row.value);
      let engines = parsed.searchEngines || getDefaultEngines();
      engines = mergeEnginesWithRegistry(engines);

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
      console.log('[Settings] Loaded from database');
      return inMemorySettings!;
    }
  } catch (error) {
    console.error('[Settings] Failed to read from database:', error);
  }

  inMemorySettings = getDefaultSettings();
  return inMemorySettings;
}

// ─── Write settings to DB ───
export async function updateSystemSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await loadSettingsFromDb();
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

  // Save to database
  try {
    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_DB_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: SETTINGS_DB_KEY, value: JSON.stringify(updated) },
    });
    console.log('[Settings] Saved to database');
  } catch (error) {
    console.error('[Settings] Failed to write to database:', error);
  }

  inMemorySettings = updated;
  return updated;
}
