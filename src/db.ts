import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import type { Metadata } from './ollama';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'memories.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  sqliteVec.load(_db);

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    create table if not exists memories (
      id          integer primary key autoincrement,
      created_at  text not null default (datetime('now')),
      raw_text    text not null,
      source      text not null default 'cli',
      people      text not null default '[]',
      topics      text not null default '[]',
      type        text not null default 'general',
      action_items text not null default '[]'
    );
  `);

  db.exec(`
    create virtual table if not exists memories_vec using vec0(
      embedding float[768]
    );
  `);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export interface Memory {
  id: number;
  created_at: string;
  raw_text: string;
  source: string;
  people: string[];
  topics: string[];
  type: string;
  action_items: string[];
}

export function insertMemory(
  db: Database.Database,
  text: string,
  embedding: number[],
  meta: Metadata,
  source: string
): number {
  const insert = db.prepare(`
    insert into memories (raw_text, source, people, topics, type, action_items)
    values (?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    text,
    source,
    JSON.stringify(meta.people),
    JSON.stringify(meta.topics),
    meta.type,
    JSON.stringify(meta.action_items)
  );

  const newId = result.lastInsertRowid as number;

  const vecInsert = db.prepare(`
    insert into memories_vec (rowid, embedding)
    values (?, ?)
  `);

  vecInsert.run(newId, new Float32Array(embedding));
  return newId;
}

export function searchByEmbedding(
  db: Database.Database,
  queryEmbedding: number[],
  limit = 10
): Array<Memory & { distance: number }> {
  const rows = db.prepare(`
    select
      m.*,
      v.distance
    from memories_vec v
    join memories m on m.id = v.rowid
    where v.embedding match ?
    and k = ?
    order by v.distance asc
  `).all(new Float32Array(queryEmbedding), limit) as any[];

  return rows.map(deserializeMemory);
}

export function listRecent(
  db: Database.Database,
  days = 7,
  typeFilter?: string
): Memory[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  let query = `
    select * from memories
    where created_at >= ?
  `;
  const params: any[] = [cutoffStr];

  if (typeFilter) {
    query += ' and type = ?';
    params.push(typeFilter);
  }

  query += ' order by created_at desc';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(deserializeMemory);
}

export function getStats(db: Database.Database, days = 30): Stats {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const typeRows = db.prepare(`
    select type, count(*) as count from memories
    where created_at >= ?
    group by type order by count desc
  `).all(cutoffStr) as { type: string; count: number }[];

  const dayRows = db.prepare(`
    select date(created_at) as day, count(*) as count from memories
    where created_at >= ?
    group by day order by count desc limit 5
  `).all(cutoffStr) as { day: string; count: number }[];

  const actionRows = db.prepare(`
    select raw_text, action_items, created_at from memories
    where action_items != '[]'
    and created_at >= ?
    order by created_at desc
  `).all(cutoffStr) as any[];

  const topicRows = db.prepare(`
    select topics from memories where created_at >= ?
  `).all(cutoffStr) as { topics: string }[];

  const topicCounts: Record<string, number> = {};
  for (const row of topicRows) {
    const topics = JSON.parse(row.topics) as string[];
    for (const t of topics) {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
  }
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  return {
    typeDistribution: typeRows,
    mostActiveDays: dayRows,
    openActionItems: actionRows.map(deserializeMemory),
    topTopics: sortedTopics
  };
}

function deserializeMemory(row: any): any {
  return {
    ...row,
    people: JSON.parse(row.people || '[]'),
    topics: JSON.parse(row.topics || '[]'),
    action_items: JSON.parse(row.action_items || '[]')
  };
}

export interface Stats {
  typeDistribution: { type: string; count: number }[];
  mostActiveDays: { day: string; count: number }[];
  openActionItems: Memory[];
  topTopics: { topic: string; count: number }[];
}
