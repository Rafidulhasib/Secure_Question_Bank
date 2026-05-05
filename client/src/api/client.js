export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function assetUrl(path) {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${FILE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: isFormData || options.body === undefined ? options.body : JSON.stringify(options.body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export function queryString(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function questionFileUrl(questionId, token, accessToken) {
  return `${API_BASE_URL}/questions/${questionId}/file${queryString({ token, accessToken })}`;
}
