declare global {
    namespace Express {
        interface Request {
            user?: {
                role?: 'admin' | 'vendor' | 'customer';
            };
        }
    }
}

export {};