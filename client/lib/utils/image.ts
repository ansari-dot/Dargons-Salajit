const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = new URL(API_URL).origin;

export const resolveBackendImageUrl = (imageUrl?: string | null): string => {
  const value = imageUrl?.trim();
  if (!value || /^(data|blob):/i.test(value)) return value || '';

  const normalizedValue = value.replace(/^\/?uploads\//i, '/uploads/');

  try {
    const parsedUrl = new URL(normalizedValue, API_ORIGIN);
    if (parsedUrl.pathname.startsWith('/uploads/')) {
      return `${API_ORIGIN}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};
