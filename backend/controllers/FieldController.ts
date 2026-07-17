import { Request, Response } from 'express';
import { FieldModel } from '../models/FieldModel.js';

export const getFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const fields = await FieldModel.getFields();
    res.json(fields);
  } catch (error) {
    console.error('Error reading fields:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createField = async (req: Request, res: Response): Promise<void> => {
  const { api_name, label, data_type, required, options } = req.body;
  
  if (!api_name) {
    res.status(400).json({ error: 'api_name is required' });
    return;
  }

  try {
    const newField = await FieldModel.createOrUpdateField({ api_name, label, data_type, required, options });
    res.json(newField);
  } catch (error) {
    console.error('Error writing field:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
