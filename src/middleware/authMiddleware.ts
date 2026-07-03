import { type Request, type Response, type NextFunction } from "express";
import { auth } from "#lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function userDataMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            req.user = null;
            return next();
        }

        req.user = {
            data: session?.user,
        };

        return next(); 
    } catch (err) {
        return res.status(500).json({ message: "Auth error" });
    }
}