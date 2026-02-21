export interface ActiveEffect {
  addDependency(dep: unknown): void;
  invalidate(): void;
}

let currentEffect: ActiveEffect | null = null;

export function getCurrentEffect(): ActiveEffect | null {
  return currentEffect;
}

export function setCurrentEffect(effect: ActiveEffect | null): void {
  currentEffect = effect;
}

/** Called by signal/computed getters to register themselves with the active consumer. */
export function trackDep(dep: unknown): void {
  currentEffect?.addDependency(dep);
}
