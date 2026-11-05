import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './paths.js';

export const config = JSON.parse(fs.readFileSync(path.join(DATA, 'config.json'), 'utf8'));
