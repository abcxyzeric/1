
export const buildWorldCreationPrompt = (fieldName: string, currentContext: any) => {
  return `
  Nhiệm vụ: Sáng tạo nội dung cho trường dữ liệu: "${fieldName}".
  Bối cảnh hiện tại: ${JSON.stringify(currentContext)}
  
  Yêu cầu:
  - Chỉ trả về nội dung của trường đó. Không giải thích, không mở bài kết bài.
  - Sáng tạo, độc đáo, tránh lối mòn.
  - Ngôn ngữ: Tiếng Việt.
  `;
};
