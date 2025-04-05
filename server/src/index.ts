// File: src/index.ts
import express, { Request, Response } from 'express';
import {
  TokenParams,
  FreeMarketParams,
  TokenMetadata,
  SwapAmounts,
} from './types/interfaces';
import { PublicKey } from '@solana/web3.js';
import { launchRouter } from './routes/pumpfun/pumpfunLaunch';
// import { buildCompressedNftListingTx } from './utils/compressedNftListing';
import knex from './db/knex';
import jupiterSwapRouter from './routes/swap/jupiterSwapRoutes';
import { threadImageRouter } from './routes/feed/threadImageRoutes';
import tokenMillRouter from './routes/tokenmill/tokenMillRoutes';
import { threadRouter } from './routes/feed/threadRoutes';
import profileImageRouter from './routes/user/userRoutes';
import { pumpSwapRouter } from './routes/pumpfun/pumpSwapRoutes';
import { turnkeyAuthRouter } from './routes/auth/turnkeyAuthRoutes';

const app = express();
app.use(express.json());

// Test the database connection.
// Instead of exiting on error, we log the error and continue.
async function testDbConnection() {
  try {
    const result = await knex.raw('select 1+1 as result');
    console.log(
      'Database connection successful:',
      result.rows ? result.rows[0] : result
    );
  } catch (error) {
    console.error('Database connection failed:', error);
    console.warn('Proceeding without a successful DB connection.');
  }
}

// Run migrations.
// If migrations fail, log error and continue instead of exiting.
async function runMigrationsAndStartServer() {
  try {
    console.log('Running migrations...');
    const [batchNo, log] = await knex.migrate.latest();
    console.log(`Migrations ran successfully in batch ${batchNo}`);
    if (log.length > 0) {
      console.log('Migrations executed:', log);
    }
  } catch (error) {
    console.error('Migration error:', error);
    console.warn('Proceeding without running migrations.');
  }
}

// Use the routes
app.use('/api/pumpfun', launchRouter);
app.use('/api', threadRouter);
app.use('/api/jupiter', jupiterSwapRouter);
app.use('/api/profile', profileImageRouter);
app.use('/api/thread/images', threadImageRouter);
app.use('/api/pump-swap', pumpSwapRouter);
app.use('/api', tokenMillRouter);
app.use('/api/auth', turnkeyAuthRouter);

// Simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Start the Express server.
// Note: We now try connecting to the database and running migrations,
// but if these fail we log the error and continue to start the server.
const PORT = process.env.PORT || 8080;

(async function startServer() {
  await testDbConnection();
  await runMigrationsAndStartServer();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
