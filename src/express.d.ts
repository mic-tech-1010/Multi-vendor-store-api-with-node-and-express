declare global {
  namespace Express {
    interface Request {
      user?: {
        data: {
          id: string;
          email: string;
          name?: string;
          role?: string;
        };
      } | nulll;
    }
  }
}

export {};