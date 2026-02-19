import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Read the index.css and inline all @imports
function resolveImports(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return content.replace(/@import\s+['"](.+?)['"];/g, (_, importPath) => {
    const resolved = resolve(dirname(filePath), importPath);
    return resolveImports(resolved);
  });
}

const entryPath = resolve(root, 'src/styles/index.css');
const output = resolveImports(entryPath);

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/styles.css'), output);
console.log('CSS bundled to dist/styles.css');
