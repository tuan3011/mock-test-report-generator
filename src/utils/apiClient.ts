import type {
  GenerateStudentCommentRequest,
  GenerateStudentCommentResponse,
  GenerateSupportSummaryRequest,
  GenerateSupportSummaryResponse,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
} from '../types/report';

export const API_KEY_STORAGE_KEY = 'mock_test_gemini_api_key';
export const MODEL_STORAGE_KEY = 'mock_test_gemini_model';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || 'gemini-3.5-flash-lite';
  } catch {
    return 'gemini-3.5-flash-lite';
  }
}

export function setStoredModel(model: string): void {
  try {
    if (model.trim()) {
      localStorage.setItem(MODEL_STORAGE_KEY, model.trim());
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function postJson<T>(endpoint: string, data: any): Promise<T> {
  const customApiKey = getStoredApiKey();
  const customModel = getStoredModel();

  const payload = {
    ...data,
    ...(customApiKey ? { customApiKey } : {}),
    ...(customModel ? { customModel } : {}),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.error || `Yêu cầu thất bại với mã lỗi HTTP ${response.status}.`;
    throw new Error(errorMsg);
  }

  return resJson as T;
}

export async function requestStudentComment(
  request: Omit<GenerateStudentCommentRequest, 'customApiKey'>
): Promise<GenerateStudentCommentResponse> {
  return postJson<GenerateStudentCommentResponse>(
    '/api/generate-student-comment',
    request
  );
}

export async function requestSupportSummary(
  request: Omit<GenerateSupportSummaryRequest, 'customApiKey'>
): Promise<GenerateSupportSummaryResponse> {
  return postJson<GenerateSupportSummaryResponse>(
    '/api/generate-support-summary',
    request
  );
}

export async function requestRecommendations(
  request: Omit<GenerateRecommendationsRequest, 'customApiKey'>
): Promise<GenerateRecommendationsResponse> {
  return postJson<GenerateRecommendationsResponse>(
    '/api/generate-recommendations',
    request
  );
}
