
import { DifficultyLevel, Entity, GameConfig, OutputLength, PlayerProfile, WorldData, WorldSettingConfig } from "../../../types";
import { DIFFICULTY_LEVELS, OUTPUT_LENGTHS } from "../../../constants/promptTemplates";

export interface WorldCreationState {
  currentTab: number;
  player: PlayerProfile;
  world: WorldSettingConfig;
  config: GameConfig;
  entities: Entity[];
  isGenerating: boolean; // General loading state
  generatingField: string | null; // Specific field loading
}

export const GENRE_OPTIONS = [
  "Tiên hiệp", "Kiếm hiệp", "Cyberpunk", "Hậu tận thế", "Nhập vai học đường", 
  "Kinh dị Lovecraft", "Giả tưởng phương Tây (Fantasy)", "Khoa học viễn tưởng (Sci-Fi)", "Trinh thám", "Cung đấu",
  "Tùy chọn"
];

export const initialWorldState: WorldCreationState = {
  currentTab: 0,
  player: {
    name: '',
    gender: 'Nam',
    age: '',
    personality: '',
    background: '',
    appearance: '',
    skills: '',
    goal: ''
  },
  world: {
    worldName: '',
    genre: 'Tiên hiệp',
    context: ''
  },
  config: {
    difficulty: DIFFICULTY_LEVELS[1], // Normal
    outputLength: OUTPUT_LENGTHS[2], // Default
    customMinWords: 1000,
    customMaxWords: 3000,
    rules: [], // Clean slate, no default rules
    perspective: 'third' // Default to 3rd person
  },
  entities: [],
  isGenerating: false,
  generatingField: null
};

// Generate simple ID if uuid not available
const simpleId = () => Math.random().toString(36).substr(2, 9);

export type WorldCreationAction = 
  | { type: 'SET_TAB', payload: number }
  | { type: 'UPDATE_PLAYER', field: keyof PlayerProfile, value: string }
  | { type: 'UPDATE_WORLD', field: keyof WorldSettingConfig, value: string }
  | { type: 'UPDATE_CONFIG', field: keyof GameConfig, value: any }
  | { type: 'UPDATE_CUSTOM_WORDS', min: number, max: number }
  | { type: 'ADD_RULE', rule: string }
  | { type: 'REMOVE_RULE', index: number }
  | { type: 'ADD_ENTITY', entity: Omit<Entity, 'id'> }
  | { type: 'UPDATE_ENTITY', id: string, entity: Partial<Entity> }
  | { type: 'REMOVE_ENTITY', id: string }
  | { type: 'SET_GENERATING', isGenerating: boolean, field?: string | null }
  | { type: 'AUTO_FILL_ALL', payload: Partial<WorldData> }
  | { type: 'IMPORT_DATA', payload: WorldData };

export const worldCreationReducer = (state: WorldCreationState, action: WorldCreationAction): WorldCreationState => {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, currentTab: action.payload };
    
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, [action.field]: action.value } };
    
    case 'UPDATE_WORLD':
      return { ...state, world: { ...state.world, [action.field]: action.value } };
    
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, [action.field]: action.value } };
    
    case 'UPDATE_CUSTOM_WORDS':
      return { 
        ...state, 
        config: { 
          ...state.config, 
          customMinWords: action.min, 
          customMaxWords: action.max 
        } 
      };

    case 'ADD_RULE':
      return { ...state, config: { ...state.config, rules: [...state.config.rules, action.rule] } };

    case 'REMOVE_RULE':
      return { 
        ...state, 
        config: { 
          ...state.config, 
          rules: state.config.rules.filter((_, i) => i !== action.index) 
        } 
      };

    case 'ADD_ENTITY':
      return { 
        ...state, 
        entities: [...state.entities, { ...action.entity, id: simpleId() }] 
      };

    case 'UPDATE_ENTITY':
      return {
        ...state,
        entities: state.entities.map(e => e.id === action.id ? { ...e, ...action.entity } : e)
      };

    case 'REMOVE_ENTITY':
      return {
        ...state,
        entities: state.entities.filter(e => e.id !== action.id)
      };

    case 'SET_GENERATING':
      return { 
        ...state, 
        isGenerating: action.isGenerating,
        generatingField: action.field || null
      };

    case 'AUTO_FILL_ALL':
      return {
        ...state,
        player: { ...state.player, ...(action.payload.player || {}) },
        world: { ...state.world, ...(action.payload.world || {}) },
        entities: action.payload.entities || state.entities
      };

    case 'IMPORT_DATA':
      return {
        ...state,
        player: action.payload.player,
        world: action.payload.world,
        config: action.payload.config,
        entities: action.payload.entities,
        // Reset generating states just in case
        isGenerating: false,
        generatingField: null
      };

    default:
      return state;
  }
};
