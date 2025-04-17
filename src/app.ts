import express from 'express';
import mongoose from 'mongoose';
import connectDatabase from './config/database';
import setNavigations from './routes/navigations';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDatabase();

setNavigations(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});