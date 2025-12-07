import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'bible-app-device-id';

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.warn('localStorage não disponível, gerando deviceId temporário');
    return generateDeviceId();
  }
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    setIsLoading(false);
  }, []);

  return { deviceId, isLoading };
}

export function getPlatform(): 'web' | 'android' | 'ios' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'web';
}

export function getLocale(): string {
  return navigator.language || 'pt-BR';
}
