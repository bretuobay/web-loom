import { describe, expect, it } from 'vitest';
import { ScaleRegistry } from './scale-registry';

describe('ScaleRegistry', () => {
  it('creates and registers linear scales with configured domain/range', () => {
    const registry = new ScaleRegistry();
    const config = { id: 'x', type: 'linear', domain: [0, 10], range: [0, 100] };
    const scale = registry.create(config);

    expect(scale).toBe(registry.get('x'));
    expect(scale.domain()).toEqual(config.domain);
    expect(scale.range()).toEqual(config.range);
  });

  it('creates time scales and supports updating domain/range values', () => {
    const registry = new ScaleRegistry();
    const domain: [Date, Date] = [new Date(0), new Date(1000)];
    registry.create({ id: 'time', type: 'time', domain, range: [0, 500] });

    registry.updateDomain('time', [0, 200]);
    registry.updateRange('time', [0, 250]);

    const scale = registry.get('time');
    expect(scale).toBeDefined();
    expect(scale?.domain()).toEqual([new Date(0), new Date(200)]);
    expect(scale?.range()).toEqual([0, 250]);
  });

  it('lists the registered scale identifiers', () => {
    const registry = new ScaleRegistry();
    registry.create({ id: 'one', type: 'linear' });
    registry.create({ id: 'two', type: 'linear' });

    expect(registry.list()).toEqual(['one', 'two']);
  });
});
