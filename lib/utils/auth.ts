// Client-side only
export const isClient = typeof window !== 'undefined';

export const getToken = (): string | null => {
  if (!isClient) return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  if (isClient) {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (isClient) {
    localStorage.removeItem('token');
  }
};
