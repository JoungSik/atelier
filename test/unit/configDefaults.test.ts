import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULTS } from '../../src/configDefaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_PATH = path.resolve(__dirname, '../../package.json');

interface SchemaProperty {
  type?: string | string[];
  default?: unknown;
  enum?: unknown[];
  description?: string;
}

interface PackageJson {
  contributes: {
    configuration: {
      properties: Record<string, SchemaProperty>;
    };
  };
}

function getNested(obj: unknown, dottedKey: string): unknown {
  return dottedKey.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in acc) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

describe('config DEFAULTS vs package.json schema', () => {
  let schemaProps: Record<string, SchemaProperty>;

  before(async () => {
    const raw = await fs.readFile(PKG_PATH, 'utf8');
    const pkg = JSON.parse(raw) as PackageJson;
    schemaProps = pkg.contributes.configuration.properties;
  });

  it('모든 atelier.* 스키마 항목이 DEFAULTS에 동일한 값으로 존재', () => {
    const mismatches: string[] = [];
    for (const [fullKey, schema] of Object.entries(schemaProps)) {
      const settingKey = fullKey.replace(/^atelier\./, '');
      const codeDefault = getNested(DEFAULTS, settingKey);
      try {
        assert.deepStrictEqual(codeDefault, schema.default);
      } catch {
        mismatches.push(
          `${fullKey}: schema=${JSON.stringify(schema.default)} code=${JSON.stringify(codeDefault)}`,
        );
      }
    }
    assert.deepStrictEqual(mismatches, [], `\n${mismatches.join('\n')}`);
  });
});
