
import { GameConfig, TawaPresetConfig, PromptModule, PromptPosition, ChatMessage } from '../../../types';
import { LorebookService } from '../lorebook/LorebookEngine';
import { LSR_PRESET } from '../../../data/lsr_data';

// --- V2 ARCHITECTURE CONSTANTS ---

const POSITION_PRIORITY: Record<PromptPosition, number> = {
    'top': 0,
    'system': 10,
    'persona': 20, // World Info Sandwich layer
    'bottom': 30,
    'final': 40
};

interface PromptSegment {
    content: string;
    priority: number;
    order: number;
    source?: string;
}

// --- HELPER FUNCTIONS ---

const getPerspectivePrompt = (perspective: string, playerName: string) => {
    switch (perspective) {
        case 'first':
            return `GÓC NHÌN: NGÔI THỨ NHẤT (First Person).
            - Xưng hô: "Tôi" (hoặc xưng hô phù hợp với tính cách nhân vật).
            - Trọng tâm: Miêu tả sâu sắc nội tâm, cảm xúc và suy nghĩ chủ quan của nhân vật chính.
            - Giới hạn: Chỉ biết những gì nhân vật thấy và nghe.`;
        case 'second':
            return `GÓC NHÌN: NGÔI THỨ HAI (Second Person).
            - Xưng hô: "Bạn" (hoặc "Ngươi/Cậu/Anh").
            - Trọng tâm: Tạo cảm giác nhập vai trực tiếp, như thể người chơi đang thực sự hành động.
            - Phong cách: Dẫn dắt hành động của người chơi.`;
        case 'third':
        default:
            return `GÓC NHÌN: NGÔI THỨ BA (Third Person).
            - Xưng hô: Gọi tên nhân vật ("${playerName}"), hoặc đại từ ("Hắn", "Y", "Cô ấy", "Nàng").
            - Trọng tâm: Khách quan, điện ảnh, bao quát hành động và môi trường xung quanh.`;
    }
};

/**
 * Hàm Prompt Gameplay Chính (REFACTORED V2 - TAWA ULTIMATE)
 * Uses Data-Driven Injection & Granular Modules
 */
export const buildGameplaySystemPrompt = (
  worldSettings: any,
  playerProfile: any,
  entities: any[],
  relevantMemories: string,
  turnCount: number,
  presetConfig: TawaPresetConfig,
  gameConfig: GameConfig,
  lastUserMessage: string = "" 
) => {
  // --- BƯỚC 0: LOREBOOK PROCESSING (LSR) ---
  const lorebookEntries = LorebookService.loadLorebook(LSR_PRESET);
  
  const lsrDynamicVars = {
      'user': playerProfile.name,
  };

  const lsrPromptContent = LorebookService.scanAndActivate(lastUserMessage, lorebookEntries, lsrDynamicVars);


  // --- BƯỚC 1: KHỞI TẠO BIẾN (VARIABLE MAP) ---
  
  let minWords = 1000;
  let maxWords = 5000;
  if (gameConfig.outputLength.id === 'custom') {
      minWords = gameConfig.customMinWords || 1000;
      maxWords = gameConfig.customMaxWords || (minWords + 2000);
  } else {
      minWords = gameConfig.outputLength.minWords;
      maxWords = minWords + 4000; 
  }

  // Build Entity Content (Lorebook/World Info)
  const entityContent = entities.map((e: any) => {
      let desc = `[${e.type}] ${e.name}`;
      if (e.description) desc += `: ${e.description}`;
      if (e.type === 'NPC' && e.personality) desc += `\n(Tính cách: ${e.personality})`;
      return desc;
  }).join('\n\n');

  // Build Player Content
  const playerContent = `
[Hồ sơ nhân vật chính <user>]
- Tên: ${playerProfile.name}
- Giới tính: ${playerProfile.gender} | Tuổi: ${playerProfile.age}
- Tính cách: ${playerProfile.personality}
- Ngoại hình: ${playerProfile.appearance}
- Xuất thân: ${playerProfile.background}
- Kỹ năng: ${playerProfile.skills}
- Mục tiêu: ${playerProfile.goal}
  `.trim();

  // Build Scenario Content
  const scenarioContent = `
[Bối cảnh Thế giới & Cốt truyện]
- Tên thế giới: ${worldSettings.worldName}
- Thể loại: ${worldSettings.genre}
- Chi tiết bối cảnh: ${worldSettings.context}
  `.trim();


  // Variable Map with Defaults
  const variables: Record<string, string> = {
      'word_min': String(minWords),
      'word_max': String(maxWords),
      'output_language': 'Tiếng Việt',
      '42': '',
      'Tiên Đề Thế Giới': '',
      '<Writing_Style>': '',
      'POV_rules': '',
      'thinking_chain': '',
      'anti_rules': '',
      'npc_logic': '',
      'Quan hệ nhân vật': '',
      'enigma': '',
      'seeds': '',
      'outside_cot': '',
      'meow_FM': '',
      'nsfw_thinking_chain': '',
      
      'world_info': entityContent || "(Chưa có thông tin thực thể)",
      'persona': playerContent,
      'scenario': scenarioContent,

      'user': playerProfile.name,
      'user_info': playerContent,

      'status_1': '',
      'status_2': '',
      'snow': '',
      'branches': '',
      'update_variable': '',
      
      'table_Edit': lsrPromptContent 
  };

  const activeModules = presetConfig.modules; 
  const segments: PromptSegment[] = [];

  // --- BƯỚC 2: QUÉT MODULE & INJECTION (FIXED LOGIC) ---
  
  activeModules.forEach(mod => {
      // Skip prefill logic module, only for Assistant
      if (mod.id === 'sys_prefill_trigger') return;

      // Ensure content is handled even if empty (for clearing variables)
      const content = mod.isActive ? mod.content : '';

      // CASE A: Module has injectKey -> Inject or Append to Variable
      if (mod.injectKey) {
          const key = mod.injectKey;
          // Only append if active and content exists, otherwise empty string override might be desired logic depending on Tawa spec
          // But usually we append. If module is inactive, content is '', so appending '' does nothing.
          if (content) {
              if (variables[key]) {
                  variables[key] += "\n" + content;
              } else {
                  variables[key] = content;
              }
          }
      } 
      // CASE B: Standalone Module -> Append to Segments
      else if (mod.isActive) {
          // Fallback logic: If a module is active but lacks position/injectKey, treat it as 'final' or 'bottom'
          const position = mod.position || 'bottom'; 
          const priority = POSITION_PRIORITY[position] || POSITION_PRIORITY['bottom'];
          const order = mod.order || 999; // Default to end if no order

          segments.push({
              priority: priority,
              order: order,
              content: content,
              source: `Module:${mod.id}`
          });
      }
  });

  // --- BƯỚC 3: XỬ LÝ SEGMENTS CỐ ĐỊNH (SYSTEM OVERRIDES) ---
  
  if (playerProfile) {
    segments.push({
      priority: POSITION_PRIORITY['system'],
      order: 1, 
      content: `
<ROLEPLAY_INSTRUCTION>
User (người dùng) đang nhập vai nhân vật chính tên là "${playerProfile.name}".
- Khi nhắc đến "${playerProfile.name}", đó chính là User.
- Mọi suy nghĩ, hành động của "${playerProfile.name}" là do User điều khiển hoặc do AI dẫn dắt theo góc nhìn của User.
- Tuyệt đối KHÔNG tạo ra một nhân vật "User" tách biệt khác.
- Góc nhìn kể chuyện: Ngôi thứ 3 (theo "${playerProfile.name}") hoặc Ngôi thứ 2 (Bạn/Ngươi - nếu config yêu cầu).
</ROLEPLAY_INSTRUCTION>`,
      source: 'RoleplayInstruction'
    });
  }

  // 1. RAG Memories
  if (relevantMemories) {
      segments.push({ 
          priority: POSITION_PRIORITY['persona'], 
          order: 99, 
          content: `[Ký ức liên quan]\n${relevantMemories}`, 
          source: 'Memories' 
      });
  }

  // 2. Difficulty & Perspective
  const difficultyPrompt = `=== THIẾT LẬP ĐỘ KHÓ (${gameConfig.difficulty.label}) ===\n${gameConfig.difficulty.prompt}`;
  segments.push({ priority: POSITION_PRIORITY['system'], order: 5, content: difficultyPrompt, source: 'Difficulty' });

  const perspectivePrompt = `=== GÓC NHÌN KỂ CHUYỆN (BẮT BUỘC) ===\n${getPerspectivePrompt(gameConfig.perspective || 'third', playerProfile.name)}`;
  segments.push({ priority: POSITION_PRIORITY['system'], order: 6, content: perspectivePrompt, source: 'Perspective' });

  // 3. Mandatory Rules
  const rulesContent = gameConfig.rules.length > 0 
      ? gameConfig.rules.map((r: string, idx: number) => `${idx + 1}. ${r}`).join('\n') 
      : "Chưa có quy tắc bổ sung.";
  segments.push({ 
      priority: POSITION_PRIORITY['system'], 
      order: 7,
      content: `=== LUẬT BẤT KHẢ KHÁNG (MANDATORY RULES) ===\n${rulesContent}`, 
      source: 'UserRules' 
  });

  // 4. Status
  segments.push({
      priority: POSITION_PRIORITY['bottom'],
      order: -10,
      content: `=== TRẠNG THÁI HIỆN TẠI ===\n- Số lượt chơi (Turn): ${turnCount}`,
      source: 'GameStatus'
  });

  // --- BƯỚC 4: THAY THẾ BIẾN (VARIABLE REPLACEMENT) ---
  
  const replaceVariables = (text: string, depth = 0): string => {
      if (depth > 5) return text; 

      let processed = text;
      const tawaRegex = /\{\{(?:getvar|getglobalvar)::(.*?)\}\}/g;
      const stRegex = /\{\{([^:]*?)\}\}/g;

      let hasMatch = false;

      processed = processed.replace(tawaRegex, (match, key) => {
          hasMatch = true;
          const cleanKey = key.trim();
          return variables[cleanKey] !== undefined ? variables[cleanKey] : '';
      });

      processed = processed.replace(stRegex, (match, key) => {
          if (key.includes('::')) return match;
          
          hasMatch = true;
          const cleanKey = key.trim();
          return variables[cleanKey] !== undefined ? variables[cleanKey] : match; 
      });

      if (hasMatch) {
          return replaceVariables(processed, depth + 1);
      }
      return processed;
  };

  segments.forEach(seg => {
      seg.content = replaceVariables(seg.content);
  });

  // --- BƯỚC 5: SẮP XẾP & KẾT XUẤT ---

  segments.sort((a, b) => {
      if (a.priority !== b.priority) {
          return a.priority - b.priority;
      }
      return (a.order || 0) - (b.order || 0);
  });

  const finalPrompt = segments.map(s => s.content).join('\n\n');

  return finalPrompt + `\n\n(NHẮC LẠI: TUÂN THỦ NGHIÊM NGẶT SỐ TỪ TỪ ${minWords} ĐẾN ${maxWords} TỪ TRONG <content>)`;
};
