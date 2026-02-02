
import { AppSettings, ChatMessage, WorldData, TawaPresetConfig } from "../../../types";
import { buildGameplaySystemPrompt } from "./prompts";
import { DEFAULT_PRESET_CONFIG } from "../../../constants/tawa_modules";
import { ai } from "../client";

// Map thinking levels to token counts
const THINKING_BUDGET_MAP = {
    'auto': 0,
    'low': 4096,
    'medium': 16384,
    'high': 32768
};

export const gameplayAiService = {
  // --- GAMEPLAY STORY GENERATION (With Tawa Protocol) ---

  async generateStoryTurn(
    input: string, 
    history: ChatMessage[], 
    worldData: WorldData, 
    settings: AppSettings,
    presetConfig?: TawaPresetConfig // Updated to accept config object
  ): Promise<string> {
    try {
        // 1. Construct System Instruction using Tawa Builder
        const currentTurn = Math.floor(history.length / 2) + 1;
        
        // Use provided config or fallback to default
        const activeConfig = presetConfig || DEFAULT_PRESET_CONFIG;

        const systemInstruction = buildGameplaySystemPrompt(
          worldData.world,
          worldData.player,
          worldData.entities,
          "", // Placeholder for RAG memories
          currentTurn,
          activeConfig, 
          worldData.config,
          input // PASS USER INPUT HERE FOR LOREBOOK SCANNING
        );

        // 2. Prepare Config (High Creativity for Tawa)
        const thinkingBudget = THINKING_BUDGET_MAP[settings.thinkingBudgetLevel] || 0;
        
        const generationConfig: any = {
            temperature: settings.temperature,
            topK: settings.topK,
            topP: settings.topP,
            maxOutputTokens: settings.maxOutputTokens,
        };

        // Only add thinking budget if model supports it and budget > 0
        if (thinkingBudget > 0 && settings.aiModel.includes('pro')) {
             generationConfig.thinkingConfig = { thinkingBudget };
        }

        // 3. Prepare Contents (History + Current Input)
        const contents = history.map(msg => {
            // Nếu là tin nhắn của user trong lịch sử, bọc nó trong thẻ <user_input>
            // Lưu ý: Nếu lịch sử đã được lưu với thẻ này rồi thì không cần bọc lại, 
            // nhưng để an toàn và nhất quán, ta giả định text trong history là raw text.
            // Tuy nhiên, nếu text trong history đã có thẻ rồi thì tránh bọc 2 lần.
            let text = msg.text;
            if (msg.role === 'user' && !text.includes('<user_input>')) {
                text = `<user_input>${text}</user_input>`;
            }
            return {
                role: msg.role,
                parts: [{ text: text }]
            };
        });

        // Add current user input wrapped in <user_input>
        contents.push({
            role: 'user',
            parts: [{ text: `<user_input>${input}</user_input>` }]
        });

        // 4. Assistant Prefill Logic
        // Find the 'sys_prefill_trigger' module content to use as prefill
        const prefillModule = activeConfig.modules.find(m => m.id === 'sys_prefill_trigger');
        const prefillContent = (prefillModule && prefillModule.isActive) ? prefillModule.content : '';

        if (prefillContent) {
            contents.push({
                role: 'model',
                parts: [{ text: prefillContent }]
            });
        }

        // 5. Call AI
        const response = await ai.models.generateContent({
            model: settings.aiModel,
            contents: contents,
            config: {
                ...generationConfig,
                systemInstruction: systemInstruction
            }
        });

        let fullResponse = response.text || "";

        // Combine prefill with generated text for the final output
        if (prefillContent) {
            fullResponse = prefillContent + fullResponse;
        }

        return fullResponse || "Hệ thống không phản hồi. Vui lòng thử lại.";

    } catch (error) {
        console.error("Generate Story Error:", error);
        return `<span style="color: #ef4444;">[LỖI HỆ THỐNG: Không thể kết nối với AI Server. Chi tiết: ${error instanceof Error ? error.message : String(error)}]</span>`;
    }
  }
};
