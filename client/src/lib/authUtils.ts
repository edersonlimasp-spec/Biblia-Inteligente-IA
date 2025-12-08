export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}${path}`;
}

export function getLoginUrl(): string {
  return getApiUrl('/login');
}

export function getLogoutUrl(): string {
  return getApiUrl('/logout');
}
