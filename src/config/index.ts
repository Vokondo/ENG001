import dotenv from 'dotenv';

dotenv.config();

export const config = {
    app: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
    },    supabase: {
        url: process.env.SUPABASE_URL!,
        anonKey: process.env.SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        dbPassword: process.env.SUPABASE_DB_PASSWORD,
    },
    clerk: {
        secretKey: process.env.CLERK_SECRET_KEY!,
    },
    openRouter: {
        apiKey: process.env.OPENROUTER_API_KEY!,
    },
    redis: {
        url: process.env.REDIS_URL!,
    },
    brightData: {
        username: process.env.BRIGHTDATA_USERNAME!,
        password: process.env.BRIGHTDATA_PASSWORD!,
        host: process.env.BRIGHTDATA_HOST!,
    },
} as const;

// Validate required environment variables
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'CLERK_SECRET_KEY',
    'OPENROUTER_API_KEY',
    'REDIS_URL',
    'BRIGHTDATA_USERNAME',
    'BRIGHTDATA_PASSWORD',
    'BRIGHTDATA_HOST',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
