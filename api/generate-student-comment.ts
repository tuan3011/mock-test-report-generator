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

    if (!body?.studentName?.trim()) {
      res.status(400).json({ error: 'Họ và tên học viên không được để trống.' });
      return;
    }

    const scoreNum = Number(body?.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      res.status(400).json({ error: 'Điểm Mock Test phải là số từ 0 đến 100.' });
      return;
    }

    if (!Array.isArray(body?.evaluations) || body.evaluations.length === 0) {
      res.status(400).json({ error: 'Vui lòng chọn đánh giá ít nhất một tiêu chí cho học viên.' });
      return;
    }

    const preferredModel =
      body?.customModel?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

    const evalSummary = body.evaluations
      .map((e: any) => `- ${e.category} > ${e.characteristic}: Mức ${e.level}/5 (${e.levelText})`)
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
- Họ và tên: ${body.studentName}
- Điểm Mock Test: ${body.score}/100 (Thang điểm 100)
- Kỹ năng giáo viên phụ trách: ${body.responsibleSkill || 'Chuyên môn'}
- Các tiêu chí đã đánh giá trong quá trình học:
${evalSummary}

Hãy biên soạn nhận xét quá trình học chuẩn mực, xưng hô "bạn" cho học viên ${body.studentName}.`;

    const parsed = await callGeminiRest(apiKey, preferredModel, prompt, systemInstruction);

    if (!parsed?.comment || typeof parsed.comment !== 'string') {
      res.status(500).json({ error: 'Phản hồi từ Gemini không đúng định dạng.' });
      return;
    }

    res.status(200).json({ comment: parsed.comment.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xử lý yêu cầu tạo nhận xét.' });
  }
}
