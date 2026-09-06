const backendOrigin = (import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5020').replace(/\/$/, '');

export const apiUrl = (path) => `${backendOrigin}${path}`;

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.message || data.errors?.[0]?.msg || 'The request failed';
    throw new Error(message);
  }

  return data;
};
