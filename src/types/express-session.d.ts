import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username?: string;
      name: string;
      role: string;
      type?: string;
    };
    returnTo?: string;
  }
}