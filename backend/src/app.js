import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();


app.use(cookieParser());
app.use(cors());
app.use(express.json());
// app.use();

export { app };
