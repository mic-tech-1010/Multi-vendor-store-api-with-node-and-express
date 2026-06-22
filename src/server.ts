import 'dotenv/config';
import express, {type Express, type Request, type Response } from 'express';
import cors, { type  CorsOptions } from 'cors';
import productrouter from '#routes/admin/product.js';
// import securityMiddleware from '#middleware/security.js';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from '#lib/auth.js';
import userRouter from '#routes/admin/user.js';
import departmentRouter from '#routes/admin/department.js';
import categoryRouter from '#routes/admin/category.js';
import cloudinaryRouter from '#routes/admin/cloudinary.js';
import homeSectionRouter from '#routes/admin/homeSection.js';
import homeSectionItemsRouter from '#routes/admin/homeSectionItems.js';
import homeSectionGroupRouter from '#routes/admin/homeSectionGroup.js';
import homePageRouter from '#routes/public/home.js';
import productDetailsRouter from '#routes/public/products.js'
import { createCartRouter } from '#routes/public/cart.js';
import { prisma } from '#db/prisma.js';
import CartService from '#services/cartService.js';
import { authMiddleware } from "./middleware/authMiddleware";
import cookieParser from 'cookie-parser';

const app: Express = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';

const corsOptions: CorsOptions = {
  origin: [frontendUrl, adminUrl],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200
};

const cartService  = new CartService(prisma);

app.use(cookieParser());

app.use(cors(corsOptions));

app.use(express.json());

// app.use(authMiddleware);

app.all('/api/auth/*splat', toNodeHandler(auth));

// app.use(securityMiddleware);

app.use('/api/products', productrouter);

app.use('/api/users', userRouter);

app.use('/api/departments', departmentRouter);

app.use('/api/categories', categoryRouter);

app.use('/api/cloudinary', cloudinaryRouter);

app.use('/api/homePageSections', homeSectionRouter);

app.use('/api/homePageSectionItems', homeSectionItemsRouter);

app.use('/api/homePageSectionGroups', homeSectionGroupRouter);

app.use('/public/homepage', homePageRouter);

app.use('/public/products', productDetailsRouter);

app.use ('/public/cart', createCartRouter(cartService));

const port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 4000;

app.listen(port, () => {
  console.log(`Server is running on http://${process.env.APP_HOST}:${port}`);
});
