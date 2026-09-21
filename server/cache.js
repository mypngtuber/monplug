import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.resolve(process.cwd(), '.astracut_cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export class LocalCache {
  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.nsDir = path.join(CACHE_DIR, namespace);
    if (!fs.existsSync(this.nsDir)) {
      fs.mkdirSync(this.nsDir, { recursive: true });
    }
  }

  static generateFingerprint(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const stat = fs.statSync(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(`${filePath}:${stat.size}:${stat.mtimeMs}`);
    return hash.digest('hex');
  }

  get(key) {
    try {
      const p = path.join(this.nsDir, `${key}.json`);
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Cache read error for ${key}:`, e.message);
    }
    return null;
  }

  set(key, value) {
    try {
      const p = path.join(this.nsDir, `${key}.json`);
      fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`Cache write error for ${key}:`, e.message);
      return false;
    }
  }

  delete(key) {
    try {
      const p = path.join(this.nsDir, `${key}.json`);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  clear() {
    try {
      const files = fs.readdirSync(this.nsDir);
      for (const f of files) {
        fs.unlinkSync(path.join(this.nsDir, f));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  getStats() {
    try {
      const files = fs.readdirSync(this.nsDir);
      let totalSize = 0;
      for (const f of files) {
        const s = fs.statSync(path.join(this.nsDir, f));
        totalSize += s.size;
      }
      return { count: files.length, totalSizeKb: Math.round(totalSize / 1024) };
    } catch (e) {
      return { count: 0, totalSizeKb: 0 };
    }
  }
}
