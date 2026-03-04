import { getDb, insertMemory } from './db';
import { getEmbedding, extractMetadata, checkHealth } from './ollama';
import type { CaptureResult } from './types';

export async function captureMemory(text: string, source = 'cli'): Promise<CaptureResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  if (text.length > 4000) {
    throw new Error('Text exceeds 4000 character limit');
  }

  const healthy = await checkHealth();
  if (!healthy) {
    throw new Error(
      'Ollama is not running. Start it with: ollama serve\n' +
      'If this is your first time, also run: npm run install-models'
    );
  }

  const [embedding, metadata] = await Promise.all([
    getEmbedding(text.trim()),
    extractMetadata(text.trim())
  ]);

  const db = getDb();
  const id = insertMemory(db, text.trim(), embedding, metadata, source);

  const row = db.prepare('select created_at from memories where id = ?').get(id) as { created_at: string };

  return {
    id,
    type: metadata.type,
    topics: metadata.topics,
    people: metadata.people,
    action_items: metadata.action_items,
    created_at: row.created_at
  };
}
