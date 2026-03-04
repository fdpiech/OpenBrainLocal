#!/bin/bash
echo "=== Open Brain Health Check ==="

echo -n "Node.js:      "
node --version 2>/dev/null || echo "NOT FOUND - install from nodejs.org"

echo -n "Ollama:       "
if command -v ollama &> /dev/null; then
  echo "installed ($(ollama --version))"
else
  echo "NOT FOUND - install from ollama.com"
fi

echo -n "Ollama serve: "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "RUNNING"
else
  echo "NOT RUNNING - run 'ollama serve' in a separate terminal"
fi

echo -n "nomic-embed-text: "
ollama list 2>/dev/null | grep -q "nomic-embed-text" && echo "present" || echo "MISSING - run npm run install-models"

echo -n "llama3.2:3b:  "
ollama list 2>/dev/null | grep -q "llama3.2:3b" && echo "present" || echo "MISSING - run npm run install-models"

echo -n "memories.db:  "
[ -f memories.db ] && echo "exists" || echo "not created yet (created on first capture)"

echo ""
echo "If all checks pass, run: npm run capture \"Your first note\""
