#!/bin/bash
set -e
source .env 2>/dev/null || true

echo "=== Open Brain E2E Test ==="

echo ""
echo "Step 1: Health check"
bash scripts/health-check.sh

echo ""
echo "Step 2: Capture three test memories"
npm run capture "Decided to use sqlite-vec over pgvector for the local memory system. Key reason was portability - no Docker required."
sleep 2
npm run capture "Met with Ted Miller today. He is looking for more software engineering work and less RPA. Risk of losing him if we do not find a project that stretches him technically."
sleep 2
npm run capture "Insight: smaller local LLM models work well for metadata extraction if you use the JSON format flag in Ollama. Quality is close to GPT-4o-mini for structured tasks."

echo ""
echo "Step 3: Check row counts"
node -e "
const db = require('better-sqlite3')(process.env.DB_PATH || 'memories.db');
require('sqlite-vec').load(db);
const count = db.prepare('select count(*) as c from memories').get();
const vecCount = db.prepare('select count(*) as c from memories_vec').get();
console.log('memories rows:', count.c);
console.log('memories_vec rows:', vecCount.c);
console.log('Counts match:', count.c === vecCount.c ? 'YES' : 'NO - ERROR');
"

echo ""
echo "Step 4: Verify embeddings are not null"
node -e "
const db = require('better-sqlite3')(process.env.DB_PATH || 'memories.db');
require('sqlite-vec').load(db);
const nullVecs = db.prepare('select count(*) as c from memories_vec where embedding is null').get();
console.log('Null embeddings:', nullVecs.c, nullVecs.c === 0 ? '(good)' : '(ERROR)');
"

echo ""
echo "E2E test complete. Connect MCP server to Claude Desktop and run a semantic_search to complete validation."
