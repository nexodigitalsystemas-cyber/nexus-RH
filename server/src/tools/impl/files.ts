import fs from 'fs';
import path from 'path';
import { db } from '../../db/index.js';

const BASE_DIR = process.env.NEXUS_BASE_DIR || path.resolve(process.env.HOME || '/root', 'nexus', 'documentos');

function resolveSafePath(folderOrFile: string): string {
  const target = path.resolve(BASE_DIR, folderOrFile);
  if (!target.startsWith(path.resolve(BASE_DIR))) {
    throw new Error('Caminho fora da pasta base não permitido');
  }
  return target;
}

export function listFiles(args: { folder?: string; search?: string; limit?: number }) {
  let sql = 'SELECT * FROM files WHERE status != ?';
  const params: unknown[] = ['trash'];

  if (args.folder) { sql += ' AND folder = ?'; params.push(args.folder); }
  if (args.search) { sql += ' AND (file_name LIKE ? OR extracted_text LIKE ?)'; params.push(`%${args.search}%`, `%${args.search}%`); }
  sql += ' ORDER BY created_at DESC';
  if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }

  return db.prepare(sql).all(...params);
}

export function readFile(args: { id: number }) {
  return db.prepare('SELECT * FROM files WHERE id = ?').get(args.id);
}

export function organizeFiles(args: { sourceFolder: string; targetFolder: string; filePattern?: string }) {
  const sourcePath = resolveSafePath(args.sourceFolder);
  const targetPath = resolveSafePath(args.targetFolder);

  if (!fs.existsSync(sourcePath)) {
    return { error: `Pasta de origem não existe: ${args.sourceFolder}` };
  }

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const items = fs.readdirSync(sourcePath, { withFileTypes: true });
  const moved: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    if (!item.isFile()) continue;
    if (args.filePattern && !item.name.toLowerCase().includes(args.filePattern.toLowerCase())) {
      skipped.push(item.name);
      continue;
    }

    const src = path.join(sourcePath, item.name);
    const dst = path.join(targetPath, item.name);

    try {
      fs.renameSync(src, dst);
      moved.push(item.name);

      // Atualiza ou insere registro no banco
      const existing = db.prepare('SELECT * FROM files WHERE file_name = ?').get(item.name);
      if (existing) {
        db.prepare('UPDATE files SET file_path = ?, folder = ?, category = ?, updated_at = datetime("now") WHERE id = ?')
          .run(dst, args.targetFolder, args.targetFolder, (existing as { id: number }).id);
      } else {
        const stats = fs.statSync(dst);
        const ext = path.extname(item.name).replace('.', '').toUpperCase();
        db.prepare(`
          INSERT INTO files (file_name, file_path, file_type, file_size, folder, category, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))
        `).run(item.name, dst, ext || 'UNKNOWN', stats.size, args.targetFolder, args.targetFolder);
      }
    } catch (err) {
      skipped.push(item.name);
    }
  }

  return {
    sourceFolder: args.sourceFolder,
    targetFolder: args.targetFolder,
    moved,
    skipped,
    movedCount: moved.length,
  };
}
