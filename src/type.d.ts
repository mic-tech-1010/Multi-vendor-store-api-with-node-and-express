type UserRole = 'admin' | 'vendor' | 'customer' | 'guest';

type RateLimitRole = UserRole | 'guest';

export interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    quantity: number;
    hasVariations: boolean;
    images: Image[];
    descriptionHtml: string;
    metaDescription: string;
    metaTitle: string;
    status: 'active' | 'inactive';
    createdAt: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
    department: {
        id: number;
        name: string;
        slug: string;
    };
    attributes: ProductAttribute[];
    skus: Sku[];
}

export interface Image {
    id: number;
    imageUrl: string;
    imageAltText: string;
    isPrimary: boolean;
    order: number;
}

export type ProductAttributeValue = {
    id: number;
    value: string;
    images?: Image[];
}

export type ProductAttribute = {
    id: number;
    name: string;
    type: 'text' | 'image';
    values: ProductAttributeValue[];
}

export type Sku = {
    id: number;
    sku: string;
    quantity: number;
    price: string | number;
    attributeValues: ProductAttributeValue[];
}
