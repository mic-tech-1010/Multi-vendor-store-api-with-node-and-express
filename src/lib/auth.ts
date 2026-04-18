import { prisma } from "#db/prisma.js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prismaInstance = prisma;
export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.FRONTEND_URL!],
    database: prismaAdapter(prismaInstance, {
        provider:  "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: 'string', required: true, defaultValue: 'customer', input: true
            },
            imageCldPubId: {
                type: 'string', required: false, input: true
            }
        }
    }
});