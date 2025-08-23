// src/lib/api-client.ts

// This is the single source of truth for the backend API URL.
// Pointing to the base of the cloud function.
const API_BASE_URL = 'https://us-central1-videre-saas-26178.cloudfunctions.net';

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

/**
 * A centralized fetch wrapper for making API calls to the Videre backend.
 * It automatically adds the base URL, content-type headers, and auth tokens.
 * @param endpoint The API endpoint to call (e.g., '/api/v1/patients'). It MUST be the full path from the root.
 * @param options Additional fetch options.
 * @returns The JSON response from the API.
 * @throws An error if the API response is not ok.
 */
async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { headers: customHeaders, body, ...restOptions } = options;
  
  // Ensure the endpoint starts with a slash for consistent URL construction.
  const correctedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${correctedEndpoint}`;

  const headers = new Headers({
    ...customHeaders,
  });
  
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Attempt to add the auth token from localStorage if running on the client.
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && !headers.has('Authorization')) {
      headers.append('Authorization', `Bearer ${storedToken}`);
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
    body,
  });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { message: `Error en la API: ${response.status} ${response.statusText}` };
    }
    console.error("API Error:", errorData);
    throw new Error(errorData.message || 'Ocurrió un error en el servidor.');
  }
  
  // Handle responses with no content (e.g., HTTP 204).
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }

  return response.json();
}

export default apiFetch;
