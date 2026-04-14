import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ajv = new Ajv({ allErrors: true });
const schema = JSON.parse(readFileSync(resolve(root, 'feeds.schema.json'), 'utf-8'));
const validate = ajv.compile(schema);

const feeds = JSON.parse(readFileSync(resolve(root, 'feeds.public.json'), 'utf-8'));

if (!validate(feeds)) {
  console.error('feeds.public.json validation failed:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log('feeds.public.json is valid.');
