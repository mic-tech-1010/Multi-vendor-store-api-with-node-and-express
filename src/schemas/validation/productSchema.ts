export const CreateProductSchema = {
    type: 'object',
    required: ['name', 'slug', 'departmentId', 'categoryId', 'price'],
    properties: {
        name: { type: 'string', minLength: 2, maxLength: 255 },
        slug: { type: 'string', minLength: 2, maxLength: 255 },
        description: { type: 'object' }, 
        departmentId: {type: 'string' },
        categoryId: {type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        price: { type: 'number', minimum: 0 },
        quantity: { type: 'integer', minimum: 0 },
        metaTitle: { type: 'string', minLength: 2, maxLength: 100 },
        metaDescription: { type: 'string', minLength: 2, maxLength: 160 },
        hasVariations: { type: 'boolean' },
        images: {
            type: 'array',
            items: {
                type: 'object',
                required: ['imageUrl', 'imageCldPubId'],
                properties: {
                    imageUrl: { type: 'string' },
                    imageCldPubId: { type: 'string' },
                    imageAltText: { type: 'string' },
                    isPrimary: { type: 'boolean' },
                    order: { type: 'integer', minimum: 0 }
                }
            }
        }
    }
} as const;

export const UpdateProductSchema = {
    type: 'object',
    properties: {
        name: { type: 'string', minLength: 2, maxLength: 255 },
        slug: { type: 'string', minLength: 2, maxLength: 255 },
        description: { type: 'object' }, // JSON object
        departmentId: { type: 'integer', minimum: 1 },
        categoryId: { type: 'integer', minimum: 1 },
        status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
        price: { type: 'number', minimum: 0 },
        quantity: { type: 'integer', minimum: 0 },
        metaTitle: { type: 'string', minLength: 2, maxLength: 100 },
        metaDescription: { type: 'string', minLength: 2, maxLength: 160 },
        hasVariations: { type: 'boolean' },
        images: {
            type: 'array',
            items: {
                type: 'object',
                required: ['imageUrl', 'imageCldPubId'],
                properties: {
                    imageUrl: { type: 'string' },
                    imageCldPubId: { type: 'string' },
                    imageAltText: { type: 'string' },
                    isPrimary: { type: 'boolean' },
                    order: { type: 'integer', minimum: 0 }
                }
            }
        }
    }
} as const;
