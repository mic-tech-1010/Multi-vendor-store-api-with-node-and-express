import type { NextFunction, Request, Response } from "express";
import { aj } from '../config/arcjet';
import { slidingWindow, type ArcjetNodeRequest } from "@arcjet/node";

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if(process.env.NODE_ENV === 'test') return next();

  try {
    const role: RateLimitRole = req.user?.role ?? 'guest';

    let limit: number;
    let message: string;

    switch (role) {
      case 'admin':
        limit = 20;
        message = "Admin users are limited to 20 requests per minute.";
        break;
        case 'vendor':
        limit = 15;
        message = "Vendor users are limited to 15 requests per minute.";
        break;
        case 'customer':
        limit = 10;
        message = "Customer users are limited to 10 requests per minute.";
        break;
        default:
        limit = 5;
        message = "Guest users are limited to 5 requests per minute. please log in for higher limits.";
        break;
    }

    const client = aj.withRule(
        slidingWindow({
            mode: 'LIVE',
            interval: '1m',
            max: limit
        })
    )

    const arcjettRequest: ArcjetNodeRequest = {
        method: req.method,
        headers: req.headers,
        url: req.originalUrl ?? req.url,
        socket: { remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0' }
    }

    const decision = await client.protect(arcjettRequest);

    if (decision.isDenied() && decision.reason.isBot()) {
        return res.status(403).json({ error: "Forbidden", message: "Automated request are not allowed" });
    }

     if (decision.isDenied() && decision.reason.isShield()) {
        return res.status(403).json({ error: "Forbidden", message: "Request Blocked by security policy" });
    }

     if (decision.isDenied() && decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too many requests", message });
    }

    next();

  } catch (error) {
    console.log(`Arcjet middleware error: ${error}`);
    res.status(500).json({ error: "Internal Server Error", message: "An error occurred while processing your request." });
  }
}

export default securityMiddleware;