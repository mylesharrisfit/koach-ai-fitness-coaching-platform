// Minimal ESM hook: resolve Vite-style extensionless relative imports (./x → ./x.js)
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !path.extname(specifier)) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const candidate = path.resolve(parentDir, specifier + '.js');
    if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
  }
  return next(specifier, context);
}
