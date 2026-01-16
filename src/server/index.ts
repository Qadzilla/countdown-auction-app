import app from './app.js';
import { startSweeper } from '../domain/sweeper.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Start background sweeper to auto-close expired auctions
  startSweeper();
});
