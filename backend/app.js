import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { connection } from './database/connection.js';
import { errorMiddleware } from './middlewares/error.js';
import userRouter from './routers/userRoutes.js';
import auctionItemRouter from './routers/auctionItemRoutes.js';

const app = express();
config({
    path: './config/config.env'
});

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(cookieParser()); //to access generated token    
app.use(express.json()); //to parse json data
app.use(express.urlencoded({ extended: true })); //to parse url encoded data
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
})); //to upload files

app.use('/api/v1/user', userRouter);
app.use('/api/v1/auctionitem', auctionItemRouter); //there should not be a single capital letter in the route it can thorw error

connection();
app.use(errorMiddleware);

export default app;