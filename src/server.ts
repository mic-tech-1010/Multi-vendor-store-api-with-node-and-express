import 'dotenv/config';
import express, {type Express, type Request, type Response } from 'express';
import cors, { type  CorsOptions } from 'cors';
import productrouter from '#routes/product.js';
import securityMiddleware from '#middleware/security.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '#lib/auth.js';

const app: Express = express();

const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  
  credentials: true,              
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.get('/api/data', (req: Request, res: Response) => {
  res.json({ message: "Hello from Express!" });
});

app.use('/api/products', productrouter);

const port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 4000;

app.listen(port, () => {
  console.log(`Server is running on http://${process.env.APP_HOST}:${port}`);
});
