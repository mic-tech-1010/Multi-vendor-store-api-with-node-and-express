declare global {
  namespace Express {
    interface Request {
      user?: {
        role: "admin" | "vendor" | "customer";
        data: {
          id: string;
          email: string;
          name?: string;
          role?: string;
        };
      };
    }
  }
}

export {};