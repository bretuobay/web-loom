/** Internal interface for any reactive node that can be tracked as a dependency. */
export interface Trackable {
  _addSub(fn: () => void): void;
  _removeSub(fn: () => void): void;
}

export interface ActiveEffect {
  addDependency(dep: Trackable): void;
}

let currentEffect: ActiveEffect | null = null;

export function getCurrentEffect(): ActiveEffect | null {
  return currentEffect;
}

export function setCurrentEffect(effect: ActiveEffect | null): void {
  currentEffect = effect;
}

/** Called by signal/computed getters to register themselves with the active consumer. */
export function trackDep(dep: Trackable): void {
  currentEffect?.addDependency(dep);
}
