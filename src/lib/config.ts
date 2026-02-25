import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';

export type AppConfig = {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
};

const CONFIG_FILE = new File(Paths.document, 'config.json');
const TOKEN_KEY = 'github_token';

const DEFAULT_CONFIG: AppConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  filePath: 'todo.md',
};

export async function loadConfig(): Promise<AppConfig> {
  if (!CONFIG_FILE.exists) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = await CONFIG_FILE.text();
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  CONFIG_FILE.write(JSON.stringify(config));
}

export async function loadToken(): Promise<string> {
  return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? '';
}

export async function saveToken(token: string): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function isConfigured(config: AppConfig, token: string): boolean {
  return Boolean(config.owner && config.repo && token);
}
