// Production-safe logging utility
const isProduction = process.env.NODE_ENV === 'production';
const enableDebugLogging = process.env.ENABLE_DEBUG_LOGGING === 'true';
const enableSensitiveLogging = process.env.ENABLE_SENSITIVE_LOGGING === 'true';

export class Logger {
  static info(message: string, data?: any) {
    if (!isProduction || enableDebugLogging) {
      console.log('[INFO]', message, data ? JSON.stringify(data) : '');
    }
  }
  
  static warn(message: string, data?: any) {
    console.warn('[WARN]', message, data ? JSON.stringify(data) : '');
  }
  
  static error(message: string, error?: any) {
    console.error('[ERROR]', message, error?.message || error);
  }
  
  static debug(message: string, data?: any) {
    if (!isProduction && enableDebugLogging) {
      console.log('[DEBUG]', message, data ? JSON.stringify(data) : '');
    }
  }
  
  static sensitive(message: string, data?: any) {
    if (!isProduction && enableSensitiveLogging) {
      console.log('[SENSITIVE]', message, data ? JSON.stringify(data) : '');
    }
  }
}
