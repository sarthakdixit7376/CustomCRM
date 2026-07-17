import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const fieldsPath = path.join(dataDir, 'fields.json');

let fieldsWriteLock: Promise<void> = Promise.resolve();

export const FieldModel = {
  getFields: async () => {
    const data = await fs.readFile(fieldsPath, 'utf8');
    return JSON.parse(data);
  },
  
  createOrUpdateField: async (newFieldData: any) => {
    return new Promise((resolve, reject) => {
      fieldsWriteLock = fieldsWriteLock.then(async () => {
        try {
          const data = await fs.readFile(fieldsPath, 'utf8');
          const fields = JSON.parse(data);
          
          const existingIndex = fields.findIndex((f: any) => f.api_name === newFieldData.api_name);
          
          if (existingIndex >= 0) {
            fields[existingIndex] = { ...fields[existingIndex], ...newFieldData };
          } else {
            fields.push(newFieldData);
          }
          
          await fs.writeFile(fieldsPath, JSON.stringify(fields, null, 2));
          resolve(newFieldData);
        } catch (error) {
          reject(error);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
