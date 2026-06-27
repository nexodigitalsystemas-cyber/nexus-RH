import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { db } from '../../db/index.js';

const REPORTS_DIR = process.env.NEXUS_REPORTS_DIR || path.resolve(process.env.HOME || '/root', 'nexus', 'documentos', 'relatorios');

export function createReport(args: {
  name: string;
  type: 'excel' | 'pdf';
  description: string;
  file_path?: string;
  file_size?: number;
}) {
  const result = db.prepare(`
    INSERT INTO reports (name, type, status, description, file_path, file_size, created_at)
    VALUES (?, ?, 'pronto', ?, ?, ?, datetime('now'))
  `).run(args.name, args.type, args.description, args.file_path || null, args.file_size || 0);

  return db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
}

export function listReports(args: { type?: string; limit?: number }) {
  let sql = 'SELECT * FROM reports ORDER BY created_at DESC';
  const params: unknown[] = [];

  if (args.type) { sql = 'SELECT * FROM reports WHERE type = ? ORDER BY created_at DESC'; params.push(args.type); }
  if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }

  return db.prepare(sql).all(...params);
}

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // fall through
    }
  }
  throw new Error('Esperado um array ou string JSON de array');
}

export function generateExcelReport(args: {
  filename: string;
  title: string;
  sheetName?: string;
  headers: string[] | string;
  rows: unknown[] | string;
}) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const headers = parseArray<string>(args.headers);
  const rows = parseArray<unknown>(args.rows);

  const filePath = path.join(REPORTS_DIR, args.filename);
  const wsData = [[args.title], [], headers, ...rows];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, args.sheetName || 'Dados');
  xlsx.writeFile(wb, filePath);

  const stats = fs.statSync(filePath);
  const report = createReport({
    name: args.filename,
    type: 'excel',
    description: args.title,
    file_path: filePath,
    file_size: stats.size,
  });

  return { filePath, fileSize: stats.size, report };
}
