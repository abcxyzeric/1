
export interface SaveFile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: any; 
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

export type ThinkingBudgetLevel = 'auto' | 'low' | 'medium' | 'high';

export interface AppSettings {
  soundVolume: number;
  musicVolume: number;
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  safetySettings?: SafetySetting[];
  aiModel: 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
  // Advanced AI Params
  contextSize: number;
  maxOutputTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  thinkingBudgetLevel: ThinkingBudgetLevel;
}

export interface SystemLog {
  id?: number;
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'warning';
}

export enum GameState {
  MENU = 'MENU',
  WORLD_CREATION = 'WORLD_CREATION',
  PLAYING = 'PLAYING',
  SETTINGS = 'SETTINGS'
}

export interface DifficultyLevel {
  id: string;
  label: string;
  prompt: string;
}

export interface OutputLength {
  id: string;
  label: string;
  minWords: number;
}

// --- NEW WORLD CREATION TYPES ---

export type EntityType = 'NPC' | 'LOCATION' | 'CUSTOM';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  // Specific fields
  personality?: string; // Only for NPC
  customType?: string; // Only for CUSTOM
}

export interface PlayerProfile {
  name: string;
  gender: string;
  age: string;
  personality: string;
  background: string;
  appearance: string;
  skills: string;
  goal: string;
}

export interface WorldSettingConfig {
  worldName: string;
  genre: string;
  context: string;
}

export type NarrativePerspective = 'first' | 'second' | 'third';

export interface GameConfig {
  difficulty: DifficultyLevel;
  outputLength: OutputLength;
  customMinWords?: number;
  customMaxWords?: number;
  rules: string[];
  perspective: NarrativePerspective; // New field for POV
}

export interface WorldData {
  player: PlayerProfile;
  world: WorldSettingConfig;
  config: GameConfig;
  entities: Entity[];
  // Optional state for loading saved games
  savedState?: {
    history: ChatMessage[];
    turnCount: number;
  };
}

// Navigation Prop Type
export interface NavigationProps {
  onNavigate: (state: GameState) => void;
  onGameStart?: (data: WorldData) => void;
  onImportSetup?: (data: WorldData) => void; // New prop for importing setup only
  activeWorld?: WorldData | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  choices?: string[]; // Added field to persist action choices
}

// --- NEW TAWA PRESET TYPES (REFACTOR V2) ---

// Define the depth layers for the prompt construction
export type PromptPosition = 'top' | 'system' | 'persona' | 'bottom' | 'final';

export interface PromptModule {
  id: string;
  label: string;
  isActive: boolean; // Trạng thái Bật/Tắt
  content: string;   // Nội dung Prompt
  isCore?: boolean;  // Đánh dấu nếu đây là COT (không thể tắt)
  
  // V2 Architecture Fields
  injectKey?: string; // Nếu có, nội dung sẽ được tiêm vào {{getvar::key}} thay vì nối chuỗi
  position?: PromptPosition; // Vị trí ưu tiên trong chuỗi prompt (nếu không có injectKey)
  order?: number; // Thứ tự sắp xếp chi tiết trong cùng một position (nhỏ xếp trước)
}

export interface TawaPresetConfig {
  cot: PromptModule; // Lõi tư duy
  modules: PromptModule[]; // Danh sách các module
}
