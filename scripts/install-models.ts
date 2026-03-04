import { execSync } from 'child_process';

const models = ['nomic-embed-text', 'llama3.2:3b'];

for (const model of models) {
  console.log(`Pulling ${model}...`);
  execSync(`ollama pull ${model}`, { stdio: 'inherit' });
}
