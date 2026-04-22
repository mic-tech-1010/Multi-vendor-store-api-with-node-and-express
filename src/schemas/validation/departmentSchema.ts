export const CreateDepartmentSchema = {
  type: 'object',
  required: ['name', 'slug', 'metaTitle', 'metaDescription'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    slug: { type: 'string', minLength: 2, maxLength: 100 },
    metaTitle: { type: 'string', minLength: 2, maxLength: 100 },
    metaDescription: { type: 'string', minLength: 2, maxLength: 160 },
    bannerUrl: { type: 'string' },
    bannerCldPubId: { type: 'string' },
  }
} as const;