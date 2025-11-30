import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import type { ViewportSize, Orientation } from '../types';

/**
 * Observable viewport size and orientation tracker
 */
export class ViewportObservable {
  private _size$ = new BehaviorSubject<ViewportSize>(this.getCurrentSize());
  private _orientation$ = new BehaviorSubject<Orientation>(this.getCurrentOrientation());

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to resize events with debounce
      fromEvent(window, 'resize')
        .pipe(debounceTime(150))
        .subscribe(() => {
          this._size$.next(this.getCurrentSize());
          this._orientation$.next(this.getCurrentOrientation());
        });

      // Listen to orientation change
      fromEvent(window, 'orientationchange').subscribe(() => {
        this._orientation$.next(this.getCurrentOrientation());
      });
    }
  }

  get size$(): Observable<ViewportSize> {
    return this._size$.asObservable();
  }

  get orientation$(): Observable<Orientation> {
    return this._orientation$.asObservable();
  }

  get width$(): Observable<number> {
    return this._size$.pipe(map(size => size.width));
  }

  get height$(): Observable<number> {
    return this._size$.pipe(map(size => size.height));
  }

  getCurrentSize(): ViewportSize {
    if (typeof window === 'undefined') {
      return { width: 1920, height: 1080, devicePixelRatio: 1 };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  getCurrentOrientation(): Orientation {
    if (typeof window === 'undefined') {
      return 'landscape';
    }

    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  /**
   * Create a media query observable
   */
  mediaQuery(query: string): Observable<boolean> {
    if (typeof window === 'undefined') {
      return new BehaviorSubject(false).asObservable();
    }

    const mediaQueryList = window.matchMedia(query);
    const subject = new BehaviorSubject(mediaQueryList.matches);

    const handler = (e: MediaQueryListEvent) => subject.next(e.matches);
    
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handler);
    }

    return subject.asObservable();
  }
}

export const viewportObservable = new ViewportObservable();
