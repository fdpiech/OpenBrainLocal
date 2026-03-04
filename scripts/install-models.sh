#!/bin/bash
echo "Checking Ollama..."
if ! command -v ollama &> /dev/null; then
  echo "Ollama not found. Install it from https://ollama.com then re-run this script."
  exit 1
fi

echo "Pulling nomic-embed-text (embedding model, ~274MB)..."
ollama pull nomic-embed-text

echo "Pulling llama3.2:3b (metadata extraction, ~2GB)..."
ollama pull llama3.2:3b

echo "Done. Run 'ollama serve' in a separate terminal before using Open Brain."
