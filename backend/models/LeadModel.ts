import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const leadsPath = path.join(dataDir, 'leads.json');

let leadsWriteLock: Promise<void> = Promise.resolve();

export const LeadModel = {
  getLeads: async () => {
    const data = await fs.readFile(leadsPath, 'utf8');
    const leads = JSON.parse(data);
    leads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return leads;
  },

  createLead: async (leadData: any) => {
    return new Promise((resolve, reject) => {
      leadsWriteLock = leadsWriteLock.then(async () => {
        try {
          const data = await fs.readFile(leadsPath, 'utf8');
          const leads = JSON.parse(data);
          
          const newLead = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...leadData
          };
          
          leads.push(newLead);
          await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2));
          
          resolve(newLead);
        } catch (error) {
          reject(error);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  },

  deleteLead: async (id: string) => {
    return new Promise((resolve, reject) => {
      leadsWriteLock = leadsWriteLock.then(async () => {
        try {
          const data = await fs.readFile(leadsPath, 'utf8');
          const leads = JSON.parse(data);
          
          const filteredLeads = leads.filter((lead: any) => lead.id !== id);
          
          if (leads.length === filteredLeads.length) {
             resolve(null);
             return;
          }

          await fs.writeFile(leadsPath, JSON.stringify(filteredLeads, null, 2));
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
