import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.scoutflow',
  appName: 'ScoutFlow',
  webDir: 'dist', // тут лежить твій збірний фронтенд
  server: {
    // Для локального запуску залишаємо server порожнім
    // URL не вказуємо, тоді Capacitor буде використовувати локальний веб-директори
    cleartext: true // дозволяє HTTP, якщо потрібно
  }
};

export default config;
