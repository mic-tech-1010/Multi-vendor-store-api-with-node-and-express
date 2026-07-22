export const searchLocationSchema = {
    type: "object",

    properties: {
        q: {
            type: "string",
            minLength: 2,
            maxLength: 100,
        },
    },

    required: ["q"],

    additionalProperties: false,
} as const;