export interface Product {
    id: string;
    name: string;
    brand: string;
    map_price: number;
    category: string;
}

export interface Listing {
    id: string;
    product_id: string;
    retailer_domain: string;
    url: string;
    last_price: number;
    last_scraped: Date;
}

export interface Violation {
    id: string;
    listing_id: string;
    price_difference: number;
    detected_at: Date;
    status: 'active' | 'resolved';
}