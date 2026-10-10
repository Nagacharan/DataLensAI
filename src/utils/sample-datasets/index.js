import { salesDataset } from './salesData.js';
import { studentDataset } from './studentData.js';
import { expensesDataset } from './expensesData.js';
import { normalizeDataset } from '../file-parsers/normalizer.js';

export const SAMPLE_DATASETS = [
  {
    id: 'sales',
    title: 'Global Tech Sales 2024',
    badge: 'Sales & Revenue',
    description: salesDataset.description,
    rowsCount: salesDataset.data.length,
    getNormalized: () => normalizeDataset(salesDataset.data, salesDataset.name),
  },
  {
    id: 'student',
    title: 'Student Academic Performance',
    badge: 'Education & Testing',
    description: studentDataset.description,
    rowsCount: studentDataset.data.length,
    getNormalized: () => normalizeDataset(studentDataset.data, studentDataset.name),
  },
  {
    id: 'expenses',
    title: 'Corporate Expenses Q1 2024',
    badge: 'Finance & Operations',
    description: expensesDataset.description,
    rowsCount: expensesDataset.data.length,
    getNormalized: () => normalizeDataset(expensesDataset.data, expensesDataset.name),
  },
];
