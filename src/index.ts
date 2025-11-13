import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import router from './routes/router.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.get('/', (_req, res) => res.send('✅ Helpdesk API is running'));
app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));