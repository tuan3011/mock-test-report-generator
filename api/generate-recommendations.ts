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

async function callGeminiRest(
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
          const errData = (await response.json().catch(() => ({}))) as any;
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;

          if (response.status === 503 || response.status === 429) {
            lastError = new Error(`Mô hình ${model} đang bận (${errMsg}). Đang thử mô hình khác...`);
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }

          if (response.status === 400 || response.status === 403) {
            throw new Error(`Khóa Gemini API không hợp lệ hoặc đã hết hạn (${errMsg}).`);
          }

          throw new Error(errMsg);
        }

        const data = (await response.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Không nhận được phản hồi từ AI.');

        return cleanJsonResponse(text);
      } catch (err: any) {
        lastError = err;
        if (err.message && err.message.includes('API không hợp lệ')) throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối với Gemini API sau nhiều lần thử.');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST.' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Dữ liệu JSON không hợp lệ.' });
        return;
      }
    }

    const apiKey = body?.customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(400).json({
        error:
          'Chưa cấu hình Google Gemini API Key. Vui lòng thêm biến môi trường GEMINI_API_KEY trên Vercel hoặc nhấn nút "API Key" ở góc trên trang web để nhập key cá nhân.',
      });
      return;
    }

    if (!Array.isArray(body?.selectedRecommendations) || body.selectedRecommendations.length === 0) {
      res.status(400).json({ error: 'Vui lòng chọn ít nhất một đề xuất.' });
      return;
    }

    const preferredModel =
      body?.customModel?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

    const recsList = body.selectedRecommendations.map((r: string) => `- ${r}`).join('\n');
    const details = body.customDetails?.trim()
      ? `\nChi tiết thực tế bổ sung từ giáo viên:\n${body.customDetails.trim()}`
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
- Tên lớp: ${body.className || 'Lớp học'}
- Giáo viên phụ trách: ${body.teacherName || 'Giáo viên'}
- Kỹ năng phụ trách: ${body.responsibleSkill || 'Chuyên môn'}
- Các đề xuất đã chọn:
${recsList}${details}

Hãy viết đoạn đề xuất hoàn chỉnh cho Mục 3 của báo cáo.`;

    const parsed = await callGeminiRest(apiKey, preferredModel, prompt, systemInstruction);

    if (!parsed?.recommendations || typeof parsed.recommendations !== 'string') {
      res.status(500).json({ error: 'Phản hồi từ Gemini không đúng định dạng.' });
      return;
    }

    res.status(200).json({ recommendations: parsed.recommendations.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xử lý yêu cầu tạo đề xuất.' });
  }
}
