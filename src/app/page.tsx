'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getStoredUser } from '../lib/api';

// Custom typewriter hook matching instructions:
// Takes text, speed (default 38ms), startDelay (default 600ms).
// After delay, reveals one character at a time. Returns { displayed, done }.
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let intervalId: NodeJS.Timeout;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (index < text.length) {
          setDisplayed((prev) => prev + text.charAt(index));
          index++;
        } else {
          setDone(true);
          clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showButtons, setShowButtons] = useState(false);

  // Background video refs & states for mouse scrubbing
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const prevXRef = useRef<number | null>(null);

  useEffect(() => {
    setUser(getStoredUser());

    // Fade-in action buttons 400ms after load
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Mouse scrubbing handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const currentX = e.clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const SENSITIVITY = 0.8;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;

      let newTargetTime = targetTimeRef.current + timeOffset;
      // Clamp targetTime between 0 and duration
      newTargetTime = Math.max(0, Math.min(newTargetTime, video.duration));
      targetTimeRef.current = newTargetTime;

      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = newTargetTime;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.05) {
      video.currentTime = targetTimeRef.current;
    } else {
      isSeekingRef.current = false;
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      targetTimeRef.current = video.currentTime;
    }
  };

  const typewriterText = "We merge rigorous software engineering with intentional design to build secure, scalable, and high-performance digital products. Now, what are we building?";
  const { displayed, done } = useTypewriter(typewriterText, 38, 600);

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-white select-none">
      
      {/* Background Video */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          objectFit: 'cover',
          objectPosition: '70% center'
        }}
        muted
        playsInline
        preload="auto"
        onSeeked={handleSeeked}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Dark overlay backdrop to keep high contrast text legible */}
      <div className="fixed inset-0 bg-white/25 pointer-events-none z-0" />

      {/* HERO SECTION */}
      <section className="relative z-10 w-full h-screen flex flex-col justify-end md:justify-center pb-16 md:pb-0 px-5 sm:px-8 md:px-12 overflow-hidden">
        <div className="max-w-xl relative z-10 text-black">
          
          {/* Logo Mark above content */}
          <div className="mb-8 flex items-center gap-2.5">
            <svg
              width="42"
              height="42"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <defs>
                <linearGradient id="vxr-hero-grad" x1="8" y1="16" x2="56" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <polyline
                points="8,18 32,46 56,18"
                stroke="url(#vxr-hero-grad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
              />
              <polyline
                points="17,18 32,37 47,18"
                stroke="url(#vxr-hero-grad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span 
              className="text-3xl font-black tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              vexor
            </span>
          </div>

          {/* Blurred intro label */}
          <div 
            className="pointer-events-none select-none mb-6 leading-snug"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 400,
              filter: 'blur(1.2px)',
              color: '#000000',
            }}
          >
            Hey there, welcome to Vexor IT Solutions,<br />
            Adaptive Software Engineering & Digital Architecture.
          </div>

          {/* Typewriter text */}
          <p 
            className="mb-8 font-normal tracking-tight min-h-[72px]"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              color: '#000000',
            }}
          >
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-cursor-blink" />
            )}
          </p>

          {/* Action pill buttons container */}
          <div
            className={`flex flex-wrap gap-3 items-center transition-all duration-700 ease-out ${
              showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[8px]'
            }`}
          >
            <Link
              href={user ? "/dashboard" : "/login"}
              className="inline-flex items-center justify-center bg-black text-white border border-black/10 rounded-full text-[14px] sm:text-[16px] px-6 py-[0.55em] font-bold whitespace-nowrap shadow-lg shadow-black/10 hover:bg-neutral-800 transition-all cursor-pointer"
            >
              {user ? 'Enter Workspace' : 'Sign In to Workspace'}
            </Link>

            <Link
              href="https://vexoritsolutions.site"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-black border border-black/30 rounded-full text-[14px] sm:text-[16px] px-6 py-[0.55em] font-semibold whitespace-nowrap hover:bg-neutral-100 transition-all cursor-pointer shadow-sm"
            >
              Visit Site
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
