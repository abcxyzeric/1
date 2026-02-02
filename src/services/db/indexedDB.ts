import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppSettings, SaveFile, SystemLog } from '../../types';
import { DEFAULT_SAFETY_SETTINGS } from '../../constants/promptTemplates';

interface RPGDatabase extends DBSchema {
  saves: {
    key: string;
    value: SaveFile;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  logs: {
    key: number;
    value: SystemLog;
    autoIncrement: true;
  };
}

const DB_NAME = 'aetheria-rpg-db';
const DB_VERSION = 1;

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<RPGDatabase>>;

  constructor() {
    this.dbPromise = openDB<RPGDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      return !!db;
    } catch (error) {
      console.error("DB Connection Failed:", error);
      return false;
    }
  }

  async logEvent(message: string, type: 'info' | 'error' | 'warning' = 'info') {
    const db = await this.dbPromise;
    await db.add('logs', {
      timestamp: Date.now(),
      message,
      type
    } as SystemLog);
  }

  async getSettings(): Promise<AppSettings> {
    const db = await this.dbPromise;
    const settings = await db.get('settings', 'user_settings');
    
    const defaults: AppSettings = {
        soundVolume: 50,
        musicVolume: 50,
        theme: 'dark',
        fontSize: 'medium',
        safetySettings: DEFAULT_SAFETY_SETTINGS,
        aiModel: 'gemini-3-pro-preview',
        // New Defaults
        contextSize: 2000000,
        maxOutputTokens: 65000, // Safe default, logic handles thinking budget separately
        temperature: 1.3,
        topK: 500,
        topP: 0.95,
        thinkingBudgetLevel: 'high'
    };

    if (!settings) {
        return defaults;
    }

    // Merge defaults with saved settings to ensure new fields exist
    return { ...defaults, ...settings };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.dbPromise;
    await db.put('settings', settings, 'user_settings');
  }

  async hasSaves(): Promise<boolean> {
    const db = await this.dbPromise;
    const count = await db.count('saves');
    return count > 0;
  }

  async saveGameState(saveData: SaveFile): Promise<void> {
    const db = await this.dbPromise;
    await db.put('saves', saveData);
  }

  async getAllSaves(): Promise<SaveFile[]> {
    const db = await this.dbPromise;
    return db.getAll('saves');
  }

  async deleteSave(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('saves', id);
  }
}

export const dbService = new DatabaseService();