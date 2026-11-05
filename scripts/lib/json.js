import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';

export const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
};

export const writeJson = (file, data, pretty = false) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, pretty ? 2 : 0) + (pretty ? '\n' : ''));
};

/** Gzipped newline-delimited JSON writer. */
export function ndjsonWriter(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const gz = zlib.createGzip({ level: 6 });
  const done = new Promise((resolve, reject) => {
    gz.pipe(fs.createWriteStream(file)).on('finish', resolve).on('error', reject);
  });
  return {
    write: (obj) => gz.write(JSON.stringify(obj) + '\n'),
    close: () => { gz.end(); return done; },
  };
}

export async function* ndjsonReader(file) {
  const input = fs.createReadStream(file).pipe(zlib.createGunzip());
  for await (const line of readline.createInterface({ input, crlfDelay: Infinity })) {
    if (line) yield JSON.parse(line);
  }
}
