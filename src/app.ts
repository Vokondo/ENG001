import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import { productsRouter } from './routes/products';
import { scrapeRouter } from './routes/scrape';
import { violationsRouter } from './routes/violations';
import { healthRouter } from './routes/health';
import { authMiddleware } from './lib/clerk/auth';
import { logger } from './lib/logger/winston';
import { config } from './config';

const app = express();

// Middleware
app.use(cors());
app.use(json());
app.use(authMiddleware);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        body: req.body,
        ip: req.ip,
    });
    next();
});

// Routes
app.use('/products', productsRouter);
app.use('/scrape', scrapeRouter);
app.use('/violations', violationsRouter);
app.use('/health', healthRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(500).json({
        error: config.app.nodeEnv === 'production' 
            ? 'Internal server error' 
            : err.message,
    });
});

// Start the server
const PORT = config.app.port;
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});