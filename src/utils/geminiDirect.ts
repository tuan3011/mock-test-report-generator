import type {
  GenerateStudentCommentRequest,
  GenerateStudentCommentResponse,
  GenerateSupportSummaryRequest,
  GenerateSupportSummaryResponse,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
} from '../types/report';

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

async function callGeminiRestWithFallback(
  apiKey: string,
  preferredModel: string,
  prompt: string,
  systemInstruction: string
): Promise<any> {
  const models = Array.from(new Set([preferredModel, ...FALLBACK_MODELS])).filter(Boolean);
  let lastError: Error | null = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;

          // If rate limit / quota or high demand (503/429), try next model or retry
          if (response.status === 503 || response.status === 429) {
            lastError = new Error(`Mô hình ${model} đang bận (${errMsg}). Đang chuyển mô hình dự phòng...`);
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }

          // Authentication error (400 or 403)
          if (response.status === 400 || response.status === 403) {
            throw new Error(`Khóa Gemini API không hợp lệ hoặc đã hết hạn (${errMsg}). Vui lòng kiểm tra lại API Key.`);
          }

          throw new Error(errMsg);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Mô hình không trả về nội dung nhận xét.');
        }

        return cleanJsonResponse(text);
      } catch (err: any) {
        lastError = err;
        // If it's an explicit auth error, don't keep cycling models
        if (err.message && err.message.includes('API không hợp lệ')) {
          throw err;
        }
      }
    }
  }

  throw lastError || new Error('Không thể kết nối với dịch vụ Google Gemini sau nhiều lần thử.');
}

/**
 * Direct Client-Side Gemini AI generation for Student Comments
 */
export async function generateStudentCommentDirect(
  request: GenerateStudentCommentRequest,
  apiKey: string,
  modelName = 'gemini-3.5-flash-lite'
): Promise<GenerateStudentCommentResponse> {
  if (!apiKey?.trim()) {
    throw new Error('Chưa có Gemini API Key. Vui lòng nhập key trong mục "API Key" ở góc trên bên phải.');
  }

  if (!request.studentName?.trim()) {
    throw new Error('Họ và tên học viên không được để trống.');
  }

  const scoreNum = Number(request.score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    throw new Error('Điểm Mock Test phải là số từ 0 đến 100.');
  }

  if (!Array.isArray(request.evaluations) || request.evaluations.length === 0) {
    throw new Error('Vui lòng chọn đánh giá ít nhất một tiêu chí cho học viên.');
  }

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

  const parsed = await callGeminiRestWithFallback(apiKey, modelName, prompt, systemInstruction);

  if (!parsed.comment || typeof parsed.comment !== 'string') {
    throw new Error('Phản hồi từ Gemini không đúng định dạng mong đợi.');
  }

  return { comment: parsed.comment.trim() };
}

/**
 * Direct Client-Side Gemini AI generation for Support Summary (Section 2)
 */
export async function generateSupportSummaryDirect(
  request: GenerateSupportSummaryRequest,
  apiKey: string,
  modelName = 'gemini-3.5-flash-lite'
): Promise<GenerateSupportSummaryResponse> {
  if (!apiKey?.trim()) {
    throw new Error('Chưa có Gemini API Key. Vui lòng nhập key trong mục "API Key" ở góc trên bên phải.');
  }

  if (!Array.isArray(request.selectedActivities) || request.selectedActivities.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một hoạt động hỗ trợ đã thực hiện.');
  }

  const activitiesList = request.selectedActivities.map((a) => `- ${a}`).join('\n');
  const details = request.customDetails?.trim()
    ? `\nChi tiết thực tế bổ sung từ giáo viên:\n${request.customDetails.trim()}`
    : '';

  const systemInstruction = `Bạn là giáo viên trung tâm tiếng Anh đang soạn thảo Mục 2 của Báo cáo sau Mock Test: "Chia sẻ và nhìn nhận từ giáo viên về quá trình theo sát hỗ trợ lớp và những cách giải quyết mà giáo viên đã thực hiện".

VAI TRÒ VÀ VĂN PHONG:
- Viết dưới góc nhìn trung thực, trách nhiệm và tâm huyết của giáo viên phụ trách ("giáo viên", "GV").
- Tổng hợp mạch lạc các giải pháp hỗ trợ lớp và học viên gặp khó khăn.
- Nêu rõ các hành động đã thực hiện (làm việc riêng, nói chuyện trực tiếp, nhắc nhở, giao bài tập đơn giản hơn...).
- Nêu trung thực các trường hợp chưa kịp hỗ trợ hoặc cần thêm thời gian theo dõi (nếu có trong dữ liệu).
- Văn phong tự nhiên, chân thành, mang tính xây dựng.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất JSON:
{
  "summary": "Nội dung chia sẻ về quá trình hỗ trợ bằng tiếng Việt"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các hành động hỗ trợ đã thực hiện:
${activitiesList}${details}

Hãy viết đoạn chia sẻ hoàn chỉnh cho Mục 2 của báo cáo.`;

  const parsed = await callGeminiRestWithFallback(apiKey, modelName, prompt, systemInstruction);

  if (!parsed.summary || typeof parsed.summary !== 'string') {
    throw new Error('Phản hồi từ Gemini không đúng định dạng mong đợi.');
  }

  return { summary: parsed.summary.trim() };
}

/**
 * Direct Client-Side Gemini AI generation for Recommendations (Section 3)
 */
export async function generateRecommendationsDirect(
  request: GenerateRecommendationsRequest,
  apiKey: string,
  modelName = 'gemini-3.5-flash-lite'
): Promise<GenerateRecommendationsResponse> {
  if (!apiKey?.trim()) {
    throw new Error('Chưa có Gemini API Key. Vui lòng nhập key trong mục "API Key" ở góc trên bên phải.');
  }

  if (!Array.isArray(request.selectedRecommendations) || request.selectedRecommendations.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một đề xuất.');
  }

  const recsList = request.selectedRecommendations.map((r) => `- ${r}`).join('\n');
  const details = request.customDetails?.trim()
    ? `\nChi tiết thực tế bổ sung từ giáo viên:\n${request.customDetails.trim()}`
    : '';

  const systemInstruction = `Bạn là giáo viên trung tâm tiếng Anh đang soạn thảo Mục 3 của Báo cáo sau Mock Test: "Giáo viên có đề xuất nào cho lớp và cách giải quyết học viên có vấn đề như thế nào không?".

VAI TRÒ VÀ VĂN PHONG:
- Viết dưới góc nhìn chuyên môn, đề xuất giải pháp thiết thực cho học viên, lớp học và sự phối hợp từ trung tâm / phụ huynh.
- Phân tách rõ ràng giữa giải pháp cho học viên gặp vấn đề và đề xuất chung cho toàn lớp.
- Văn phong khách quan, mang tính xây dựng, hướng đến sự tiến bộ của học viên.

ĐỊNH DẠNG ĐẦU RA:
Trả về duy nhất JSON:
{
  "recommendations": "Nội dung đề xuất giải pháp bằng tiếng Việt"
}`;

  const prompt = `Thông tin lớp học:
- Tên lớp: ${request.className || 'Lớp học'}
- Giáo viên phụ trách: ${request.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${request.responsibleSkill || 'Chuyên môn'}
- Các đề xuất đã chọn:
${recsList}${details}

Hãy viết đoạn đề xuất hoàn chỉnh cho Mục 3 của báo cáo.`;

  const parsed = await callGeminiRestWithFallback(apiKey, modelName, prompt, systemInstruction);

  if (!parsed.recommendations || typeof parsed.recommendations !== 'string') {
    throw new Error('Phản hồi từ Gemini không đúng định dạng mong đợi.');
  }

  return { recommendations: parsed.recommendations.trim() };
}
