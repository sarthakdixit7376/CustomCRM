import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Key Middleware
const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    const clientApiKey = req.header('X-API-Key');
    if (clientApiKey !== apiKey) {
       res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
       return;
    }
  }
  next();
};

app.use(apiKeyMiddleware);

const dataDir = path.join(__dirname, 'data');
const fieldsPath = path.join(dataDir, 'fields.json');
const leadsPath = path.join(dataDir, 'leads.json');

// Write lock for leads
let leadsWriteLock: Promise<void> = Promise.resolve();

// Write lock for fields
let fieldsWriteLock: Promise<void> = Promise.resolve();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/fields
app.get('/api/fields', async (req, res) => {
  try {
    const data = await fs.readFile(fieldsPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading fields:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/fields
app.post('/api/fields', (req, res) => {
  const { api_name, label, data_type, required, options } = req.body;
  
  if (!api_name) {
    res.status(400).json({ error: 'api_name is required' });
    return;
  }

  fieldsWriteLock = fieldsWriteLock.then(async () => {
    try {
      const data = await fs.readFile(fieldsPath, 'utf8');
      const fields = JSON.parse(data);
      
      const existingIndex = fields.findIndex((f: any) => f.api_name === api_name);
      const newField = { api_name, label, data_type, required, options };
      
      if (existingIndex >= 0) {
        fields[existingIndex] = { ...fields[existingIndex], ...newField };
      } else {
        fields.push(newField);
      }
      
      await fs.writeFile(fieldsPath, JSON.stringify(fields, null, 2));
      res.json(newField);
    } catch (error) {
      console.error('Error writing field:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }).catch((error) => {
      console.error('Lock error in POST /api/fields:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  });
});

// GET /api/leads
app.get('/api/leads', async (req, res) => {
  try {
    const data = await fs.readFile(leadsPath, 'utf8');
    const leads = JSON.parse(data);
    leads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(leads);
  } catch (error) {
    console.error('Error reading leads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/leads
app.post('/api/leads', (req, res) => {
  leadsWriteLock = leadsWriteLock.then(async () => {
    try {
      const data = await fs.readFile(leadsPath, 'utf8');
      const leads = JSON.parse(data);
      
      const newLead = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...req.body
      };
      
      leads.push(newLead);
      await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2));
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error('Error writing lead:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }).catch((error) => {
      console.error('Lock error in POST /api/leads:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  });
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  
  leadsWriteLock = leadsWriteLock.then(async () => {
    try {
      const data = await fs.readFile(leadsPath, 'utf8');
      const leads = JSON.parse(data);
      
      const filteredLeads = leads.filter((lead: any) => lead.id !== id);
      
      if (leads.length === filteredLeads.length) {
         res.status(404).json({ error: 'Lead not found' });
         return;
      }

      await fs.writeFile(leadsPath, JSON.stringify(filteredLeads, null, 2));
      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }).catch((error) => {
      console.error('Lock error in DELETE /api/leads:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
