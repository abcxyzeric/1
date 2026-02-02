
export const TAWA_REGEX = {
  // Bắt nội dung trong thẻ <thinking> - Strict: Không nhận nếu bị bao bởi ngoặc hoặc nháy
  THINKING: /(?<![("'`])<thinking>([\s\S]*?)<\/thinking>(?![)"'`])/i,

  // Bắt nội dung trong thẻ <content> - Strict
  CONTENT: /(?<![("'`])<content>([\s\S]*?)<\/content>(?![)"'`])/i,

  // Bắt nội dung trong thẻ <branches> - Strict
  BRANCHES: /(?<![("'`])<branches>([\s\S]*?)<\/branches>(?![)"'`])/i,

  // Bắt nội dung trong thẻ <table_stored> - Strict
  TABLE_STORED: /(?<![("'`])<table_stored>([\s\S]*?)<\/table_stored>(?![)"'`])/i,

  // Regex để xóa các đoạn kiểm tra tiến độ và bảng trạng thái rác
  ARTIFACTS_REMOVAL: [
    /\[(?:KIỂM TRA|CHECKING|TIẾN ĐỘ|PROGRESS|Hệ thống)[^\]]*\]/gi,
    /^\s*\((?:Tiếp tục|Lưu ý|Note|Chuyển sang|Kết thúc|Giai đoạn)[^)]*\).*$/gm,
    /(?:^\s*\*[^*\n]+:.*\n){2,}/gm, 
    /^\s*\*Ngày \d+.*lưu lạc.*\*\s*$/gmi,
    /^\s*(?:Tình trạng văn bản|Khối lượng từ|Tôi cần bổ sung|Để đảm bảo chất lượng|Token Limit warning|Mục tiêu:).*$/gmi,
    /^seeds:[\s\S]*?(?=\n\n|$)/gim,
    /^relation:[\s\S]*?(?=\n\n|$)/gim,
    /^enigma:[\s\S]*?(?=\n\n|$)/gim,
    /^echoes:[\s\S]*?(?=\n\n|$)/gim,
    /<word_count>[\s\S]*?<\/word_count>/gi,
    /<details>[\s\S]*?<\/details>/gi // Aggressive details strip
  ],

  // Regex xóa ký tự * 
  ASTERISK_REMOVAL: /\*/g
};

/**
 * Trích xuất nội dung nằm giữa tag mở và tag đóng
 * @param text Văn bản gốc
 * @param tagName Tên thẻ (không bao gồm < >)
 * @returns Nội dung bên trong hoặc null
 */
export const extractTagContent = (text: string, tagName: string): string | null => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * Loại bỏ các thẻ hệ thống để lấy nội dung truyện thuần túy hiển thị ra UI
 * @param text Văn bản gốc
 * @returns Văn bản đã làm sạch
 */
export const cleanRawText = (text: string): string => {
  if (!text) return "";
  
  let cleaned = text;

  // Danh sách các thẻ cần loại bỏ hoàn toàn (bao gồm cả nội dung bên trong)
  const tagsToRemove = [
    'thinking',
    'table_stored',
    'branches',
    'memory_table_guide',
    'user_input',
    'word_count',
    'details' // Remove <details> blocks often used for branches/logs
  ];

  tagsToRemove.forEach(tag => {
    const regex = new RegExp(`<${tag}>[\\s\\S]*?<\/${tag}>`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Xóa các thẻ content wrapper (giữ lại nội dung bên trong nếu không match logic trên)
  // Tuy nhiên, logic ưu tiên là: Nếu có <content>, chỉ lấy nội dung trong <content>.
  // Nếu không có <content>, thì lấy text đã clean các thẻ system.
  
  const contentBody = extractTagContent(text, 'content');
  if (contentBody) {
      return contentBody;
  }

  // Fallback: Xóa nốt thẻ <content> rỗng hoặc lỗi nếu còn sót
  cleaned = cleaned.replace(/<\/?content>/gi, '');

  return cleaned.trim();
};

// Cập nhật hàm cleanText (Legacy support)
export const cleanText = (text: string): string => {
  return cleanRawText(text);
};
