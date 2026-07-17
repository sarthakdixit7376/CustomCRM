import express from 'express';
import cors from 'cors';
import routes from './routes/index';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount all routes under /api
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
