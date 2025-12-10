export async function fetchScreeningResults(jobPostingId) {
  // Use Vite env var if provided, otherwise default to localhost backend.
  // When developing with a separate frontend dev server, a relative path
  // will hit the frontend and return HTML (index.html), causing the
  // "Unexpected token '<'" JSON parse error. Point the request to the
  // backend explicitly or configure a dev proxy.
  const baseUrl = `http://localhost:8000/api/screening/get-resume-screening/results`;
  const url = jobPostingId ? `${baseUrl}?job_posting_id=${encodeURIComponent(jobPostingId)}` : baseUrl;

  const token = localStorage.getItem('access_token');
  const res = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  // If backend responded with non-JSON (HTML error page or index.html)
  // or a non-OK status, read the text for a helpful error message instead
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch screening results: ${res.status} ${text}`);
  }

  // Guard against HTML responses that would break JSON.parse
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON response but received: ${text.substring(0, 500)}`);
  }

  const data = await res.json();
  return data.results || [];
}
