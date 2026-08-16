import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SeedImageMapLoaderImpl } from './seed-image-map.loader';

function tmpFile(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'riff-img-')); // eslint-disable-line
  const filePath = join(dir, name);
  writeFileSync(filePath, content);
  return filePath;
}

describe('SeedImageMapLoaderImpl', () => {
  it('loads _imagenesPendientesMigracion as a map of string arrays', () => {
    const path = tmpFile(
      'seed.json',
      JSON.stringify({
        _imagenesPendientesMigracion: { 'prod-001': ['a.jpg'], 'prod-002': ['b.jpg', 'c.jpg'] },
      }),
    );
    const map = new SeedImageMapLoaderImpl().load(path);
    expect(map).toEqual({ 'prod-001': ['a.jpg'], 'prod-002': ['b.jpg', 'c.jpg'] });
  });

  it('throws on invalid JSON', () => {
    const path = tmpFile('bad.json', '{ not json');
    expect(() => new SeedImageMapLoaderImpl().load(path)).toThrow(/JSON válido/i);
  });

  it('throws when _imagenesPendientesMigracion is missing', () => {
    const path = tmpFile('noseed.json', JSON.stringify({ productos: {} }));
    expect(() => new SeedImageMapLoaderImpl().load(path)).toThrow(/_imagenesPendientesMigracion/i);
  });

  it('throws when a value is not an array of strings', () => {
    const path = tmpFile(
      'badval.json',
      JSON.stringify({ _imagenesPendientesMigracion: { 'prod-001': 'notarray' } }),
    );
    expect(() => new SeedImageMapLoaderImpl().load(path)).toThrow(/arreglo de strings/i);
  });
});
