import { GoogleGenAI } from '@google/genai';
import type {
  GenerateStudentCommentRequest,
  GenerateStudentCommentResponse,
  GenerateSupportSummaryRequest,
  GenerateSupportSummaryResponse,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
} from '../src/types/report';

export class GeminiServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
  }
}

function getApiKey(customKey?: string): string {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiServiceError(
      'Chưa cấu hình Google Gemini API Key. Vui lòng nhập API Key trong phần Cài đặt API hoặc cấu hình biến môi trường GEMINI_API_KEY.',
      400
    );
  }
  return key;
}

function getPreferredModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
}

function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Executes a Gemini request with automatic fallback across models and retry on 503/429
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ])
  ).filter(Boolean);

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        break;
      }
    }
  }

  const rawMsg = lastError?.message || '';
  if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
    throw new GeminiServiceError(
      'Mô hình AI của Google hiện đang quá tải tạm thời (Lỗi 503: High Demand). Vui lòng thử lại sau giây lát hoặc sử dụng tính năng "Mẫu nhanh".',
      503
    );
  }

  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new GeminiServiceError(
      'Đã đạt giới hạn số lượt gọi API trong 1 phút của Google (Lỗi 429: Rate limit). Vui lòng đợi khoảng 20-30 giây rồi bấm thử lại.',
      429
    );
  }

  if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('403') || rawMsg.includes('400')) {
    throw new GeminiServiceError(
      'Khóa API Key không hợp lệ hoặc chưa được cấp quyền truy cập. Vui lòng kiểm tra lại API Key trong phần Cài đặt API.',
      400
    );
  }

  throw new GeminiServiceError(
    `Không thể kết nối tới Google Gemini AI: ${rawMsg || 'Lỗi không xác định.'}`,
    500
  );
}

/**
 * Section 1: Generate individual student learning progress comment
 * Follows POST-GENERATION REPORT REFINEMENT guidelines
 */
export async function generateStudentCommentService(
  request: GenerateStudentCommentRequest
): Promise<GenerateStudentCommentResponse> {
  const apiKey = getApiKey(request.customApiKey);
  const modelName = request.customModel?.trim() || getPreferredModel();

  if (!request.studentName?.trim()) {
    throw new GeminiServiceError('Họ và tên học viên không được để trống.', 400);
  }

  if (request.score === undefined || request.score === null || request.score === '') {
    throw new GeminiServiceError('Điểm Mock Test không được để trống.', 400);
  }

  const scoreNum = Number(request.score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    throw new GeminiServiceError('Điểm Mock Test phải là số từ 0 đến 100.', 400);
  }

  if (!Array.isArray(request.evaluations) || request.evaluations.length === 0) {
    throw new GeminiServiceError('Vui lòng chọn đánh giá ít nhất một tiêu chí cho học viên.', 400);
  }

  const ai = new GoogleGenAI({ apiKey });

  const evalSummary = request.evaluations
    .map((e) => `- ${e.category} > ${e.characteristic}: Mức ${e.level}/5 (${e.levelText})`)
    .join('\n');

  const systemInstruction = `Bạn là một chuyên viên biên tập báo cáo học thuật tại trung tâm tiếng Anh, phụ trách chuẩn hóa phần "Nhận xét về quá trình học" cho học viên sau kỳ thi Mock Test hàng tháng.

QUY TẮC VỀ ĐIỂM SỐ MOCK TEST (THANG 100) – BẮT BUỘC:
- Điểm bài thi Mock Test tính theo thang điểm 100 (từ 0 đến 100, có thể có số thập phân).
- Hãy hiểu điểm này là giá trị trên thang điểm 100.
- TUYỆT ĐỐI KHÔNG tự quy đổi điểm về thang 10 hay bất kỳ thang điểm nào khác.
- TUYỆT ĐỐI KHÔNG tính toán, tự sửa đổi hoặc làm tròn điểm số.
- TUYỆT ĐỐI KHÔNG tự suy đoán năng lực hay điểm mạnh/yếu của học viên chỉ dựa trên con số điểm số; nhận xét về quá trình học phải bám sát các đặc điểm và tiêu chí đánh giá đã được cung cấp. Điểm số và nhận xét định tính là độc lập.

QUY TẮC XƯNG HÔ – BẮT BUỘC (QUAN TRỌNG NHẤT):
1. Trong toàn bộ lời nhận xét: BẮT BUỘC sử dụng cách xưng hô "bạn" để gọi học viên.
   - ĐÚNG: "Bạn có thái độ học tập tốt và luôn tập trung theo dõi bài giảng."
   - ĐÚNG: "Bạn cần luyện tập thêm kỹ năng nghe để cải thiện phản xạ."
   - ĐÚNG: "Thời gian tới, bạn nên chú ý..."
   - TUYỆT ĐỐI KHÔNG DÙNG: "Con...", "Em...".
   - KHÔNG thay đổi liên tục giữa "bạn", "con", "em".
   - Không lặp lại tên riêng học viên một cách máy móc ở đầu mỗi câu; hãy sử dụng "bạn" tự nhiên.

CẤU TRÚC NHẬN XÉT LOGIC (Văn phong chuẩn báo cáo PRE-5 / PRE-7):
1. Thái độ và tinh thần học tập trên lớp (dựa trên tiêu chí Thái độ / Tham gia nếu có).
2. Những điểm mạnh về kiến thức và kỹ năng cụ thể.
3. Những điểm còn hạn chế, khó khăn cụ thể mà bạn gặp phải.
4. Hướng cải thiện hoặc lời khuyến khích thiết thực trong thời gian tới.

VĂN PHONG VÀ CÁCH DIỄN ĐẠT SƯ PHẠM:
- Sử dụng các mẫu câu tự nhiên, giàu tính học thuật:
  "Bạn đã thể hiện sự tiến bộ rõ rệt..."
  "Điểm nổi bật của bạn nằm ở..."
  "Bạn nắm khá vững các kiến thức..."
  "Tuy nhiên, bạn vẫn còn gặp khó khăn khi..."
  "Bên cạnh đó, kỹ năng... cần được cải thiện thêm..."
  "Thời gian tới, bạn nên..."
  "Nhìn chung, bạn đã có những tiến bộ đáng ghi nhận..."
- Tránh nhận xét chung chung hoặc sáo rỗng. Hãy nêu rõ khía cạnh cụ thể dựa trên tiêu chí được đánh giá.
- Cân bằng: Không chỉ tập trung điểm yếu, không khen quá mức; không dùng từ ngữ tiêu cực, phán xét.
- KHÔNG liệt kê thang điểm dạng số máy móc ("4/5", "mức tốt"). Diễn đạt thành đoạn văn hoàn chỉnh.
- Độ dài: Khoảng 3 - 5 câu văn mạch lạc, gắn kết trong 1 đoạn văn.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất JSON thuần túy:
{
  "comment": "Nội dung nhận xét về quá trình học bằng tiếng Việt, xưng hô 'bạn'"
}`;

  const prompt = `Thông tin học viên:
- Họ và tên: ${request.studentName}
- Điểm Mock Test: ${request.score}/100 (Thang điểm 100)
- Kỹ năng giáo viên phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các tiêu chí đã đánh giá trong quá trình học:
${evalSummary}

Hãy biên soạn nhận xét quá trình học chuẩn mực, xưng hô "bạn" cho học viên ${request.studentName}.`;

  try {
    const responseText = await callGeminiWithFallback(ai, modelName, prompt, systemInstruction);
    const parsed = cleanJsonResponse(responseText);

    if (!parsed.comment || typeof parsed.comment !== 'string') {
      throw new GeminiServiceError('Phản hồi từ Gemini không đúng định dạng mong đợi.', 500);
    }

    return { comment: parsed.comment.trim() };
  } catch (err: any) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      `Lỗi khi gọi Google Gemini API: ${err.message || 'Không thể tạo nhận xét.'}`,
      500
    );
  }
}

/**
 * Section 2: Generate teacher support activities summary
 * Standardizes teacher observations, actions taken, responses, and unresolved cases
 */
export async function generateSupportSummaryService(
  request: GenerateSupportSummaryRequest
): Promise<GenerateSupportSummaryResponse> {
  const apiKey = getApiKey(request.customApiKey);
  const modelName = request.customModel?.trim() || getPreferredModel();

  if (
    (!request.selectedActivities || request.selectedActivities.length === 0) &&
    !request.customDetails?.trim()
  ) {
    throw new GeminiServiceError('Vui lòng chọn ít nhất một hoạt động hỗ trợ hoặc nhập chi tiết thực tế.', 400);
  }

  const ai = new GoogleGenAI({ apiKey });

  const activitiesList = (request.selectedActivities || []).map((a) => `- ${a}`).join('\n');

  const systemInstruction = `Bạn là một chuyên viên biên tập báo cáo học thuật tại trung tâm tiếng Anh, chuẩn hóa nội dung Mục 2 trong Báo cáo sau Mock Test:
"Chia sẻ và nhìn nhận từ giáo viên về quá trình theo sát hỗ trợ lớp và những cách giải quyết mà giáo viên đã thực hiện".

MỤC TIÊU VÀ VĂN PHONG BIÊN TẬP:
- Thể hiện rõ ràng quá trình giáo viên theo sát và hỗ trợ lớp/học viên theo trình tự:
  1. Vấn đề hoặc khó khăn giáo viên quan sát được từ học viên hoặc lớp.
  2. Biện pháp can thiệp mà giáo viên ĐÃ THỰC HIỆN.
  3. Phản ứng hoặc kết quả bước đầu sau khi được hỗ trợ.
  4. Tình trạng hiện tại hoặc những vấn đề còn tồn đọng cần tiếp tục theo sát.
- Xưng hô trong mục này: Sử dụng "giáo viên" hoặc "GV" một cách trang trọng, khách quan.
- Phân biệt minh bạch giữa hành động ĐÃ LÀM, ĐANG LÀM và CHƯA KỊP THỰC HIỆN.
- Nếu giáo viên có ghi nhận chưa kịp trao đổi riêng hoặc học viên chưa tiến bộ/chưa hợp tác, hãy diễn đạt trung thực, thẳng thắn nhưng mang tính xây dựng cao.
- TUYỆT ĐỐI KHÔNG tự bịa đặt các hành động (như gọi điện phụ huynh, kèm riêng ngoài giờ) nếu dữ liệu không cung cấp.
- Không đơn thuần sao chép gạch đầu dòng; hãy liên kết thành một báo cáo mạch lạc, chuyên môn cao.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy:
{
  "summary": "Nội dung báo cáo mục 2 bằng tiếng Việt chuyên nghiệp"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các hành động hỗ trợ giáo viên ĐÃ THỰC HIỆN:
${activitiesList || '(Không chọn mục mẫu nào)'}
${request.customDetails?.trim() ? `- Ghi chú / Tình huống cụ thể từ giáo viên: ${request.customDetails.trim()}` : ''}

Hãy biên tập đoạn báo cáo hoàn chỉnh cho Mục 2.`;

  try {
    const responseText = await callGeminiWithFallback(ai, modelName, prompt, systemInstruction);
    const parsed = cleanJsonResponse(responseText);

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new GeminiServiceError('Phản hồi từ Gemini không đúng định dạng mong đợi.', 500);
    }

    return { summary: parsed.summary.trim() };
  } catch (err: any) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      `Lỗi khi gọi Google Gemini API: ${err.message || 'Không thể tạo nội dung hỗ trợ.'}`,
      500
    );
  }
}

/**
 * Section 3: Generate teacher recommendations
 * Standardizes pedagogical proposals for students, class, and center
 */
export async function generateRecommendationsService(
  request: GenerateRecommendationsRequest
): Promise<GenerateRecommendationsResponse> {
  const apiKey = getApiKey(request.customApiKey);
  const modelName = request.customModel?.trim() || getPreferredModel();

  if (
    (!request.selectedRecommendations || request.selectedRecommendations.length === 0) &&
    !request.customDetails?.trim()
  ) {
    throw new GeminiServiceError('Vui lòng chọn ít nhất một đề xuất hoặc nhập đề xuất bổ sung.', 400);
  }

  const ai = new GoogleGenAI({ apiKey });

  const recList = (request.selectedRecommendations || []).map((r) => `- ${r}`).join('\n');

  const systemInstruction = `Bạn là một chuyên viên biên tập báo cáo học thuật tại trung tâm tiếng Anh, chuẩn hóa nội dung Mục 3 trong Báo cáo sau Mock Test:
"Giáo viên có đề xuất nào cho lớp và cách giải quyết học viên có vấn đề như thế nào không?".

MỤC TIÊU VÀ NGUYÊN TẮC BIÊN TẬP:
- Đưa ra các đề xuất thiết thực, có tính khả thi cao, xuất phát trực tiếp từ các vấn đề được ghi nhận.
- Phân nhóm đề xuất mạch lạc:
  1. Đề xuất đối với học viên cụ thể (theo dõi sát sao, đặt mục tiêu, phối hợp gia đình).
  2. Đề xuất chuyên môn và phương pháp giảng dạy trên lớp (tăng cường bài tập bổ trợ, hoạt động tương tác, ôn tập trọng tâm).
  3. Đề xuất phối hợp từ phía trung tâm (liên hệ phụ huynh, tư vấn lộ trình học tập).
- Tránh đưa ra đề xuất chung chung, sáo rỗng như "cần cố gắng hơn" mà phải chỉ rõ giải pháp và hướng thực hiện.
- Tránh lặp lại nguyên văn Mục 2 (Mục 2 là những gì đã làm, Mục 3 là phương hướng và đề xuất sắp tới).
- Không khẳng định các biện pháp này đã được thực hiện.
- Giọng văn: Đề xuất sư phạm, chuẩn mực, tính xây dựng cao.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy:
{
  "recommendations": "Nội dung đề xuất mục 3 bằng tiếng Việt chuyên nghiệp"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các đề xuất giáo viên LỰA CHỌN:
${recList || '(Không chọn mục mẫu nào)'}
${request.customDetails?.trim() ? `- Đề xuất bổ sung từ giáo viên: ${request.customDetails.trim()}` : ''}

Hãy biên tập đoạn đề xuất hoàn chỉnh cho Mục 3.`;

  try {
    const responseText = await callGeminiWithFallback(ai, modelName, prompt, systemInstruction);
    const parsed = cleanJsonResponse(responseText);

    if (!parsed.recommendations || typeof parsed.recommendations !== 'string') {
      throw new GeminiServiceError('Phản hồi từ Gemini không đúng định dạng mong đợi.', 500);
    }

    return { recommendations: parsed.recommendations.trim() };
  } catch (err: any) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      `Lỗi khi gọi Google Gemini API: ${err.message || 'Không thể tạo đề xuất.'}`,
      500
    );
  }
}
