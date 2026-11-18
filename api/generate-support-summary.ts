import { generateSupportSummaryService } from '../server/geminiService';

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
      body = JSON.parse(body);
    }
    const result = await generateSupportSummaryService(body);
    res.status(200).json(result);
  } catch (err: any) {
    const status = err?.statusCode || (err?.name === 'GeminiServiceError' ? 400 : 500);
    res.status(status).json({ error: err.message || 'Lỗi xử lý yêu cầu tạo tóm tắt hỗ trợ.' });
  }
}
