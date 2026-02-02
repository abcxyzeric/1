
import { DifficultyLevel, OutputLength, SafetySetting } from "../types";

export const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'easy',
    label: 'Dễ (Easy)',
    prompt: "Độ khó trò chơi: Dễ — Cốt truyện tiến triển khiến '<user>' luôn ở trong một thế giới ấm áp tràn đầy hạnh phúc và tình yêu."
  },
  {
    id: 'normal',
    label: 'Bình thường (Normal)',
    prompt: "Độ khó: Bình thường — Cốt truyện tiến triển với họa phúc đan xen, trong tuyệt vọng có hy vọng, trong hy vọng có thử thách."
  },
  {
    id: 'hard',
    label: 'Khó (Hard)',
    prompt: `Độ khó trò chơi: Thế giới thực — Nhân vật "có nhân cách độc lập" & Diễn biến sự kiện "phù hợp logic thực tế".
    Kiểm chứng độ khó:
    - Xác minh tính hợp lý của '<input>':
    - Dựa trên '<<user>>' và '<Thiết lập thế giới & nhân vật>' để phán đoán điều này có hợp lý không?
    - Dựa trên độ khó trò chơi để xem điều này có hợp lý không? Nếu không hợp lý thì sửa lại diễn biến của '<input>' trong quá trình thúc đẩy cốt truyện.`
  },
  {
    id: 'realistic',
    label: 'Hiện thực (Realistic)',
    prompt: `Độ khó trò chơi: Khó — Cốt truyện tiến triển '<user>' phải đối mặt với những thất bại và thử thách lớn lao ập đến như dời non lấp biển.
    Kiểm chứng độ khó:
    - Xác minh tính hợp lý của '<input>':
    - Dựa trên '<<user>>' và '<Thiết lập thế giới & nhân vật>' để phán đoán điều này có hợp lý không?
    - Dựa trên độ khó trò chơi để xem điều này có hợp lý không? Nếu không hợp lý thì sửa lại diễn biến của '<input>' trong quá trình thúc đẩy cốt truyện.`
  },
  {
    id: 'torment',
    label: 'Hành hạ (Torment)',
    prompt: `Độ khó trò chơi — Dày vò: '<user>' trong quá trình cốt truyện bị kẻ tiểu nhân chiếm đoạt lợi ích; lý tưởng bị thực tế chà đạp tàn nhẫn; thiện ý bị sự lạnh lùng và hiểu lầm phụ lòng; hy vọng trong nháy mắt biến thành trò đùa của số phận; mãi mãi bần thần giữa thất bại và đau khổ.
    Kiểm chứng độ khó:
    - Xác minh tính hợp lý của '<input>':
    - Dựa trên '<<user>>' và '<Thiết lập thế giới & nhân vật>' để phán đoán điều này có hợp lý không?
    - Dựa trên độ khó trò chơi để xem điều này có hợp lý không? Nếu không hợp lý thì sửa lại diễn biến của '<input>' trong quá trình thúc đẩy cốt truyện.`
  }
];

export const OUTPUT_LENGTHS: OutputLength[] = [
  { id: 'short', label: 'Ngắn (Tối thiểu 1000 từ)', minWords: 1000 },
  { id: 'medium', label: 'Trung bình (Tối thiểu 3000 từ)', minWords: 3000 },
  { id: 'default', label: 'Mặc định (Tối thiểu 5000 từ)', minWords: 5000 },
  { id: 'long', label: 'Dài (Tối thiểu 8000 từ)', minWords: 8000 },
  { id: 'custom', label: 'Tùy chỉnh', minWords: 0 }, 
];

export const generateWordCountPrompt = (min: number, max: number) => `
<word_count_protocol>
TARGET: ${min} - ${max} words.

Bạn là một AI chuyên nghiệp. Trước khi viết cốt truyện chính, bạn BẮT BUỘC phải mở thẻ <word_count> để lập kế hoạch độ dài.

Cấu trúc bắt buộc trong thẻ <word_count>:
1. [Target] Xác định mục tiêu số từ cụ thể trong khoảng ${min}-${max}.
2. [Segmentation] Chia nhỏ cốt truyện thành 3-4 phân đoạn (Checkpoints), mỗi phân đoạn ước lượng bao nhiêu từ.
3. [Pacing] Xác định nhịp độ (Nhanh/Chậm/Dồn dập) để đạt được số từ đó mà không bị bôi chữ (filler).

Quy tắc:
- Chỉ thực hiện tính toán số học và bố cục tại đây.
- KHÔNG viết nội dung truyện, không viết suy diễn tâm lý nhân vật ở đây (Hãy để dành cho <thinking>).
- Nếu không có thẻ <word_count> ở đầu câu trả lời, hệ thống sẽ coi là lỗi nghiêm trọng.
</word_count_protocol>
`;
