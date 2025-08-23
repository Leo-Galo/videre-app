
export type ProductTag = 'Ninguna' | 'Roja' | 'Amarilla' | 'Verde';

export const DISCOUNT_TAGS_CONFIG: { 
    name: ProductTag; 
    discountPercentage: number; 
    badgeClass: string; 
}[] = [
    { name: 'Ninguna', discountPercentage: 0, badgeClass: '' },
    { name: 'Roja', discountPercentage: 50, badgeClass: 'bg-red-500 hover:bg-red-500/80' },
    { name: 'Amarilla', discountPercentage: 30, badgeClass: 'bg-yellow-400 text-yellow-950 hover:bg-yellow-400/80' },
    { name: 'Verde', discountPercentage: 20, badgeClass: 'bg-green-500 hover:bg-green-500/80' },
];

export const PRODUCT_TAGS = DISCOUNT_TAGS_CONFIG.map(t => t.name);

// Helper function to get config by tag name
export const getTagConfig = (tagName: ProductTag) => {
    return DISCOUNT_TAGS_CONFIG.find(t => t.name === tagName);
};
