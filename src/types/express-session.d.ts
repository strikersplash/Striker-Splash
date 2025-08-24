import 'express-session';

declare module 'express-session' {
  interface SessionData {
    // Keep user loosely typed to avoid compile errors when controllers attach varying shapes
    user?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    returnTo?: string;
  }
}