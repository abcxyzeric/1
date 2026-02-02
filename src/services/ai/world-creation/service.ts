
import { Type } from "@google/genai";
import { ai } from "../client";

export const worldAiService = {
  // --- WORLD CREATION ASSISTANT (STRICT LOGIC) ---

  async generateFieldContent(
    category: 'player' | 'world' | 'entity', 
    field: string, 
    contextData: any, 
    modelName: string = 'gemini-3-pro-preview'
  ): Promise<string> {
    try {
      let systemInstruction = "";
      let userPrompt = "";

      // 1. Build Prompt based on Category
      if (category === 'player') {
         systemInstruction = `Bạn là trợ lý sáng tạo nhân vật RPG chuyên nghiệp.
Nhiệm vụ: Viết nội dung cho trường dữ liệu [${field}] của nhân vật chính.
Quy tắc Output:
- Chỉ trả về nội dung mô tả. KHÔNG viết lời dẫn (như "Dưới đây là...", "Chắc chắn rồi...").
- Ngôn ngữ: Tiếng Việt.
- Văn phong: Sáng tạo, có chiều sâu, phù hợp với thiết lập nhân vật.`;

         userPrompt = `THÔNG TIN NHÂN VẬT:
- Tên: ${contextData.name}
- Giới tính: ${contextData.gender}
- Tuổi: ${contextData.age}
- Bối cảnh thế giới (Genre): ${contextData.genre || "Tùy chọn"}

YÊU CẦU: Viết nội dung cho mục: "${field}".`;

      } else if (category === 'world') {
         systemInstruction = `Bạn là kiến trúc sư thế giới ảo (World Builder).
Nhiệm vụ: Viết mô tả chi tiết cho [${field}] của thế giới.
Quy tắc Output:
- Chỉ trả về nội dung chính. KHÔNG viết lời dẫn.
- Ngôn ngữ: Tiếng Việt.
- Văn phong: Hùng vĩ, logic, khơi gợi trí tưởng tượng.`;

         userPrompt = `THÔNG TIN THẾ GIỚI:
- Thể loại (Genre): ${contextData.genre}
- Tên thế giới: ${contextData.worldName || "Chưa đặt tên"}

YÊU CẦU: Viết nội dung cho mục: "${field}".`;

      } else if (category === 'entity') {
         systemInstruction = `Bạn là người sáng tạo nội dung NPC và sự kiện cho Game RPG.
Nhiệm vụ: Viết [${field}] cho một thực thể trong game.
Quy tắc Output:
- Chỉ trả về nội dung chính. KHÔNG viết lời dẫn.
- Ngôn ngữ: Tiếng Việt.`;

         userPrompt = `THÔNG TIN THỰC THỂ:
- Tên: ${contextData.name}
- Loại: ${contextData.type} (NPC/LOCATION/CUSTOM)
- Thể loại thế giới: ${contextData.genre || "Tùy chọn"}

YÊU CẦU: Viết nội dung cho mục: "${field}".`;
      }

      // 2. Call AI
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
        }
      });

      return response.text?.trim() || "";
    } catch (error) {
      console.error("AI generateFieldContent Error:", error);
      return "Không thể kết nối với AI. Vui lòng kiểm tra API Key hoặc thử lại sau.";
    }
  },

  async generateFullWorld(concept: string, modelName: string = 'gemini-3-pro-preview'): Promise<any> {
    try {
      const prompt = `
        Bạn là một kiến trúc sư thế giới ảo (World Builder).
        Dựa trên ý tưởng cốt lõi: "${concept}", hãy xây dựng một bản thiết lập thế giới RPG hoàn chỉnh.
        
        Yêu cầu output:
        1. Ngôn ngữ: Tiếng Việt.
        2. Trả về đúng định dạng JSON theo Schema.
        3. Nội dung phải sáng tạo, logic và có chiều sâu văn học.
        4. Bao gồm:
           - 1 Nhân vật chính (Player): Có tiểu sử, tính cách, mục tiêu rõ ràng liên quan đến ý tưởng cốt lõi.
           - Bối cảnh thế giới (World): Tên, thể loại, và mô tả bối cảnh/lịch sử chi tiết.
           - 4 Thực thể (Entities): Bao gồm ít nhất 1 NPC, 1 Địa điểm (Location).
        
        LƯU Ý VỀ CẤU TRÚC ENTITY:
        - Với NPC: Phải điền đầy đủ Tên, Giới tính, Tuổi, Tính cách (từ khóa + diễn giải), Tiểu sử, Ngoại hình, Giới thiệu.
        - Với Location/Custom: Các trường giới tính/tuổi có thể để trống, nhưng mô tả phải chi tiết.
      `;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              player: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Tên nhân vật" },
                  gender: { type: Type.STRING, description: "Giới tính" },
                  age: { type: Type.STRING, description: "Tuổi" },
                  personality: { type: Type.STRING, description: "Tính cách nổi bật" },
                  background: { type: Type.STRING, description: "Tiểu sử và xuất thân" },
                  appearance: { type: Type.STRING, description: "Mô tả ngoại hình" },
                  skills: { type: Type.STRING, description: "Kỹ năng đặc biệt" },
                  goal: { type: Type.STRING, description: "Mục tiêu chính" },
                },
                required: ['name', 'gender', 'age', 'personality', 'background', 'appearance', 'skills', 'goal']
              },
              world: {
                type: Type.OBJECT,
                properties: {
                  worldName: { type: Type.STRING, description: "Tên thế giới" },
                  genre: { type: Type.STRING, description: "Thể loại" },
                  context: { type: Type.STRING, description: "Bối cảnh lịch sử, xã hội" },
                },
                required: ['worldName', 'genre', 'context']
              },
              entities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['NPC', 'LOCATION', 'CUSTOM'] },
                    name: { type: Type.STRING },
                    // Detailed fields for generation
                    gender: { type: Type.STRING, nullable: true },
                    age: { type: Type.STRING, nullable: true },
                    personalityKeywords: { type: Type.STRING, description: "Từ khóa tính cách (Vui vẻ, Lạnh lùng...)" },
                    personalityDetail: { type: Type.STRING, description: "Diễn giải tính cách chi tiết" },
                    appearance: { type: Type.STRING, description: "Mô tả ngoại hình" },
                    background: { type: Type.STRING, description: "Tiểu sử/Lịch sử hình thành" },
                    intro: { type: Type.STRING, description: "Lời chào hoặc mô tả mở đầu" },
                    customType: { type: Type.STRING, nullable: true },
                  },
                  required: ['type', 'name', 'background', 'appearance']
                }
              }
            },
            required: ['player', 'world', 'entities']
          },
          temperature: 0.9
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        
        // Post-processing entities to match App Interface
        if (data.entities && Array.isArray(data.entities)) {
            data.entities = data.entities.map((ent: any, idx: number) => {
                // Merge details into the main 'description' field for the App
                let fullDesc = "";
                
                if (ent.type === 'NPC') {
                    fullDesc = `[Giới tính: ${ent.gender || '?'}] [Tuổi: ${ent.age || '?'}]\n`;
                    fullDesc += `\n>> NGOẠI HÌNH:\n${ent.appearance}\n`;
                    fullDesc += `\n>> TIỂU SỬ:\n${ent.background}\n`;
                    fullDesc += `\n>> GIỚI THIỆU:\n"${ent.intro || '...'}"`;
                } else {
                    fullDesc = `${ent.background}\n\n(Mô tả: ${ent.appearance})`;
                }

                // Format Personality
                const fullPersonality = ent.personalityKeywords 
                    ? `${ent.personalityKeywords} - ${ent.personalityDetail || ''}` 
                    : ent.personalityDetail || "";

                return {
                    id: ent.id || `ai-ent-${Date.now()}-${idx}`,
                    type: ent.type,
                    name: ent.name,
                    description: fullDesc, // App uses this
                    personality: fullPersonality, // App uses this for NPC
                    customType: ent.customType
                };
            });
        }
        return data;
      }
      throw new Error("AI trả về phản hồi rỗng.");
    } catch (error) {
      console.error("AI generateFullWorld Error:", error);
      throw error;
    }
  }
};
