'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'smarti_intro_seen';
const FAILSAFE_MS = 12000;

export default function SplashIntro({ onFinished }) {
  const [phase, setPhase] = useState('checking');
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setPhase('fading');
    window.setTimeout(() => {
      setPhase('done');
      onFinished?.();
    }, 400);
  };

  useEffect(() => {
    const seen = (() => {
      try {
        return sessionStorage.getItem(STORAGE_KEY) === '1';
      } catch {
        return true;
      }
    })();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seen || prefersReduced) {
      finishedRef.current = true;
      setPhase('done');
      onFinished?.();
      return;
    }

    setPhase('playing');
    const timer = window.setTimeout(() => finish(), FAILSAFE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black',
        phase === 'fading' && 'pointer-events-none animate-fade-out'
      )}
    >
      {phase === 'playing' || phase === 'fading' ? (
        <video
          className="h-full w-full object-cover"
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={finish}
          onError={finish}
        />
      ) : null}
      {phase === 'playing' ? (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-6 right-6 rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          Пропустить
        </button>
      ) : null}
    </div>
  );
}
