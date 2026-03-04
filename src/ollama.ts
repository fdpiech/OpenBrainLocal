const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';
const LLM_MODEL = process.env.LLM_MODEL || 'llama3.2:3b';

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
  });

  if (!res.ok) throw new Error(`Ollama embedding failed: ${res.status}`);
  const data = await res.json() as { embedding: number[] };
  return data.embedding;
}

export async function extractMetadata(text: string): Promise<Metadata> {
  const prompt = buildMetadataPrompt(text);

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LLM_MODEL,
      prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`);
  const data = await res.json() as { response: string };

  try {
    return JSON.parse(data.response) as Metadata;
  } catch {
    console.error('Metadata parse failed, using defaults');
    return { people: [], topics: [], type: 'general', action_items: [] };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

function buildMetadataPrompt(text: string): string {
  return `You are a metadata extraction assistant. Extract structured information from the note below.
Respond with ONLY valid JSON matching this exact structure. No explanation, no markdown, no extra text.

{
  "people": ["list of person names mentioned, empty array if none"],
  "topics": ["2 to 5 short topic tags like api-platform or team-retention"],
  "type": "one of exactly: decision | person_note | insight | meeting_debrief | general",
  "action_items": ["concrete follow-up tasks if any, empty array if none"]
}

Note to extract from:
${text}`;
}

export interface Metadata {
  people: string[];
  topics: string[];
  type: string;
  action_items: string[];
}
