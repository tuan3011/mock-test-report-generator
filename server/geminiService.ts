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

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
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
 * Section 1: Generate individual student learning progress comment
 */
export async function generateStudentCommentService(
  request: GenerateStudentCommentRequest
): Promise<GenerateStudentCommentResponse> {
  const apiKey = getApiKey(request.customApiKey);
  const modelName = getModelName();

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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
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
  const modelName = getModelName();

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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
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
  const modelName = getModelName();

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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
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
