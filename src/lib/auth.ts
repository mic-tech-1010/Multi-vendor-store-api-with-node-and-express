import { prisma } from "#db/prisma.js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prismaInstance = prisma;
export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.FRONTEND_URL!],
    database: prismaAdapter(prismaInstance, {
        provider:  "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
    },
    // socialProviders: {
    //   github: {
    //      clientId: process.env.GITHUB_CLIENT_ID,
    //      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    //   },
    //   discord: {
         
    //   }
    // },
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