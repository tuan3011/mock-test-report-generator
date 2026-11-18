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
  // Ordered candidate models: prioritized by high availability and low latency
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
    // Attempt up to 2 times per model if 503/429
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

        // If error is 503 (High demand) or 429 (Rate limit), wait a brief moment and retry or switch model
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue; // retry this model once
        }

        // Otherwise break out of retry loop to try next model in waterfall
        break;
      }
    }
  }

  // If all candidate models failed, craft a helpful Vietnamese message
  const rawMsg = lastError?.message || '';
  if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
    throw new GeminiServiceError(
      'Mô hình AI của Google hiện đang quá tải tạm thời (Lỗi 503: High Demand). Vui lòng thử lại sau giây lát hoặc sử dụng tính năng "Tạo nhận xét nhanh theo tiêu chí".',
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
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
    throw new GeminiServiceError('Điểm Mock Test phải là số từ 0 đến 10.', 400);
  }

  if (!Array.isArray(request.evaluations) || request.evaluations.length === 0) {
    throw new GeminiServiceError('Vui lòng chọn đánh giá ít nhất một tiêu chí cho học viên.', 400);
  }

  const ai = new GoogleGenAI({ apiKey });

  const evalSummary = request.evaluations
    .map((e) => `- ${e.category} > ${e.characteristic}: Mức ${e.level}/5 (${e.levelText})`)
    .join('\n');

  const systemInstruction = `Bạn là một giáo viên tiếng Anh tận tâm, giàu kinh nghiệm tại trung tâm Anh ngữ, đang viết "Nhận xét về quá trình học" cho báo cáo sau bài thi Mock Test hàng tháng.

MỤC TIÊU:
Tạo đoạn văn nhận xét ngắn gọn, gắn kết, chuyên nghiệp và giàu tính khích lệ dành cho học viên.

QUY TẮC BẮT BUỘC:
1. Xưng hô: Gọi học viên là "con" một cách tự nhiên, ấm áp và gần gũi (ví dụ: "Con tiếp thu bài nhanh...", "Con cần chú ý hơn về...").
2. Chỉ nhận xét DỰA TRÊN những tiêu chí đã được đánh giá cụ thể trong danh sách. TUYỆT ĐỐI KHÔNG tự bịa ra những phẩm chất hay kỹ năng chưa được đánh giá.
3. KHÔNG liệt kê thang điểm dạng số hay mức độ máy móc (không viết "Đạt 4/5" hay "Mức Tốt"). Thay vào đó hãy diễn giải thành câu văn mạch lạc, liên kết các điểm mạnh và điểm cần cải thiện.
4. KHÔNG đồng nhất điểm thi Mock Test thấp với thái độ học kém trên lớp. Nếu điểm thi thấp nhưng thái độ được đánh giá chăm chỉ, hãy ghi nhận sự cố gắng của con và động viên con khắc phục phần kiến thức.
5. TUYỆT ĐỐI KHÔNG tự ý suy đoán, tính toán hay thay đổi điểm số Mock Test của học viên.
6. Giọng điệu: Khách quan, trung thực với quan sát của giáo viên, ngôn từ sư phạm tích cực, mang tính xây dựng, phù hợp để gửi phụ huynh và lưu trữ báo cáo chuyên môn.
7. Độ dài: Khoảng 3 - 5 câu văn mạch lạc trong 1 đoạn văn.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy (không thêm lời giải thích):
{
  "comment": "Nội dung nhận xét về quá trình học bằng tiếng Việt"
}`;

  const prompt = `Thông tin học viên:
- Họ và tên: ${request.studentName}
- Điểm Mock Test: ${request.score}/10
- Kỹ năng giáo viên phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các tiêu chí đã đánh giá trong quá trình học:
${evalSummary}

Hãy tạo nhận xét quá trình học cho học viên ${request.studentName}.`;

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

  const systemInstruction = `Bạn là giáo viên phụ trách lớp tại trung tâm Anh ngữ, đang viết Mục 2 trong Báo cáo sau Mock Test:
"Chia sẻ và nhìn nhận từ giáo viên về quá trình theo sát hỗ trợ lớp và những cách giải quyết mà giáo viên đã thực hiện".

MỤC TIÊU:
Viết một đoạn văn báo cáo chuyên nghiệp, chân thực và rõ ràng về những hành động giáo viên ĐÃ THỰC HIỆN để theo sát và hỗ trợ học viên/lớp.

QUY TẮC BẮT BUỘC:
1. Mô tả trung thực những việc giáo viên đã làm dựa trên các mục được chọn và ghi chú bổ sung.
2. Tuyệt đối KHÔNG bịa đặt thêm các cuộc trò chuyện, ngày giờ cụ thể, phản hồi của phụ huynh hay kết quả thần kỳ không có trong dữ liệu đầu vào.
3. Nếu giáo viên có chọn mục "Giáo viên chưa kịp trao đổi riêng với học viên" hoặc có học viên chưa tiến bộ/chưa hợp tác, hãy trình bày thẳng thắn, minh bạch nhưng mang tính xây dựng.
4. Phân biệt rõ hành động đã hoàn thành và hành động đang tiếp tục theo dõi.
5. Không đơn thuần chép lại danh sách gạch đầu dòng; hãy liên kết các hành động thành một đoạn văn hoàn chỉnh, logic và sư phạm.
6. Giọng điệu: Chuyên nghiệp, trách nhiệm, trung thực, mang tính xây dựng.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy:
{
  "summary": "Nội dung báo cáo mục 2 bằng tiếng Việt"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các hành động hỗ trợ giáo viên ĐÃ THỰC HIỆN:
${activitiesList || '(Không chọn mục mẫu nào)'}
${request.customDetails?.trim() ? `- Ghi chú / Trường hợp cụ thể từ giáo viên: ${request.customDetails.trim()}` : ''}

Hãy viết đoạn tổng kết mục 2 cho báo cáo.`;

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

  const systemInstruction = `Bạn là giáo viên phụ trách lớp tại trung tâm Anh ngữ, đang viết Mục 3 trong Báo cáo sau Mock Test:
"Giáo viên có đề xuất nào cho lớp và cách giải quyết học viên có vấn đề như thế nào không?".

MỤC TIÊU:
Viết một đoạn đề xuất giải pháp mạch lạc, thiết thực, giúp trung tâm và giáo viên phối hợp giải quyết các vấn đề còn tồn đọng sau kỳ thi Mock Test.

QUY TẮC BẮT BUỘC:
1. Chỉ dựa trên các đề xuất được giáo viên lựa chọn và ghi chú bổ sung.
2. Phân nhóm đề xuất một cách logic:
   - Đề xuất đối với học viên cụ thể (theo dõi, động viên, trao đổi riêng, phối hợp phụ huynh...)
   - Đề xuất về chuyên môn / giảng dạy trên lớp (tăng cường bài tập, ôn tập, hoạt động tương tác...)
   - Đề xuất phối hợp với trung tâm (liên hệ phụ huynh, tư vấn lộ trình...)
3. Tránh lặp lại nguyên văn nội dung của Mục 2 (Mục 2 là những gì đã làm, Mục 3 là những giải pháp và đề xuất cho thời gian tới).
4. Không tuyên bố các đề xuất này đã được áp dụng xong.
5. Giọng văn: Đề xuất sư phạm, lịch sự, xây dựng, mang tính thực tiễn cao.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất định dạng JSON thuần túy:
{
  "recommendations": "Nội dung đề xuất mục 3 bằng tiếng Việt"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các đề xuất giáo viên LỰA CHỌN:
${recList || '(Không chọn mục mẫu nào)'}
${request.customDetails?.trim() ? `- Đề xuất bổ sung từ giáo viên: ${request.customDetails.trim()}` : ''}

Hãy viết đoạn đề xuất hoàn chỉnh cho Mục 3 của báo cáo.`;

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
