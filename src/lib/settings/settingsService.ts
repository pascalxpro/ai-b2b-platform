import fs from 'fs';
import path from 'path';

export interface SystemSettings {
  tavilyApiKeys: string; // comma separated: "key1,key2"
  providerPriority: string[]; // e.g. ["tavily", "googlethis"]
  maxSearchLimit: number;
  defaultTargetCount: number;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

function getDefaultSettings(): SystemSettings {
  const envKeys = process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || '';
  const envPriority = process.env.SEARCH_PROVIDER_PRIORITY
    ? process.env.SEARCH_PROVIDER_PRIORITY.split(',').map(p => p.trim()).filter(Boolean)
    : ['tavily', 'googlethis'];

  return {
    tavilyApiKeys: envKeys,
    providerPriority: envPriority,
    maxSearchLimit: 50,
    defaultTargetCount: 100,
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
      inMemorySettings = {
        ...getDefaultSettings(),
        ...parsed,
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
