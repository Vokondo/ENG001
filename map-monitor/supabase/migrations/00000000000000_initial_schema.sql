-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create products table
create table if not exists products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    brand text not null,
    map_price decimal(10,2) not null,
    category text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create listings table
create table if not exists listings (
    id uuid default uuid_generate_v4() primary key,
    product_id uuid references products(id) on delete cascade not null,
    url text not null,
    last_price decimal(10,2),
    last_scraped timestamp with time zone,
    confidence decimal(4,3),
    anomalies text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create violations table
create table if not exists violations (
    id uuid default uuid_generate_v4() primary key,
    listing_id uuid references listings(id) on delete cascade not null,
    price_difference decimal(10,2) not null,
    detected_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text check (status in ('ACTIVE', 'RESOLVED')) not null,
    severity text check (severity in ('CRITICAL', 'MINOR')) not null,
    confidence decimal(4,3) not null,
    anomalies text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists idx_listings_product_id on listings(product_id);
create index if not exists idx_violations_listing_id on violations(listing_id);
create index if not exists idx_violations_status on violations(status);
create index if not exists idx_violations_detected_at on violations(detected_at);

-- Create trigger function for updated_at
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_timestamp
    before update on products
    for each row
    execute procedure trigger_set_timestamp();

create trigger set_timestamp
    before update on listings
    for each row
    execute procedure trigger_set_timestamp();
