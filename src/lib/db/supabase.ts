import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create Supabase client with anonymous key for public operations
export const supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    }
);

// Create admin client with service role key for privileged operations
export const supabaseAdmin = config.supabase.serviceRoleKey 
    ? createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        }
    )
    : null;

// Helper function to validate product ID
export async function validateProductId(productId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error validating product ID:', error);
        return false;
    }
}
