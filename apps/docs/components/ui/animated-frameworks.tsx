'use client';

import Link from 'next/link';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

interface Framework {
  name: string;
  href: string;
}

interface Props {
  frameworks: Framework[];
  variant?: 'dark' | 'adaptive';
}

export default function AnimatedFrameworks({ frameworks, variant = 'dark' }: Props) {
  const [items, setItems] = useState(frameworks);
  const [swapped, setSwapped] = useState<Set<string>>(new Set());

  // Refs stay stable across renders — no stale closure issues
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());
  const pendingFlip = useRef(false);

  // Snapshot current DOM positions (called synchronously before setItems)
  const recordPositions = useCallback(() => {
    itemRefs.current.forEach((el, name) => {
      positionsRef.current.set(name, el.getBoundingClientRect());
    });
  }, []);

  // FLIP — runs synchronously after every DOM commit
  useLayoutEffect(() => {
    if (!pendingFlip.current) return;
    pendingFlip.current = false;

    itemRefs.current.forEach((el, name) => {
      const old = positionsRef.current.get(name);
      if (!old) return;

      const next = el.getBoundingClientRect();
      const dx = old.left - next.left;
      const dy = old.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      // Invert: jump back to the old position instantly
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      // Play: on the next frame, animate back to the natural (new) position
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transform = '';

        const onEnd = () => {
          el.style.transition = '';
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
      });
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // First: record positions before the update
      recordPositions();
      pendingFlip.current = true;

      setItems((prev) => {
        const next = [...prev];
        const i = Math.floor(Math.random() * next.length);
        let j: number;
        do {
          j = Math.floor(Math.random() * next.length);
        } while (j === i);

        // Briefly highlight the two swapped pills
        setSwapped(new Set([next[i].name, next[j].name]));
        setTimeout(() => setSwapped(new Set()), 700);

        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [recordPositions]);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((fw) => (
        <Link
          key={fw.name}
          href={fw.href}
          ref={(el) => {
            if (el) itemRefs.current.set(fw.name, el);
            else itemRefs.current.delete(fw.name);
          }}
          className={[
            'px-3 py-1 rounded-full border text-xs transition-colors',
            swapped.has(fw.name)
              ? 'bg-blue-500/20 border-blue-400/60 text-blue-300'
              : variant === 'adaptive'
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-slate-800 dark:hover:text-slate-100'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 hover:border-slate-500 text-slate-400 hover:text-slate-200',
          ].join(' ')}
        >
          {fw.name}
        </Link>
      ))}
    </div>
  );
}
