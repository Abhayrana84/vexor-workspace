'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Circle, Chrome, Github, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export default function App() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isUserId = /^(VXR|CLNT)\d+$/i.test(identifier.trim());

  return (
    <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 text-white font-sans">
      
      {/* Left Column (Hero & Background Video) */}
      <div className="relative hidden lg:flex w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>

        {/* Hero Content Container */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
              },
            },
          }}
          className="z-10 w-full max-w-xs space-y-8"
        >
          {/* Brand/Logo */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="flex items-center gap-3"
          >
            <Circle className="w-5 h-5 fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight">Vexor OS</span>
          </motion.div>

          {/* Heading Block */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">Sign In to Vexor</h1>
            <p className="text-white/60 text-sm leading-relaxed px-1">
              Follow these 3 quick phases to activate your space.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            className="space-y-3"
          >
            <StepItem number={1} text="Verify your credentials" active />
            <StepItem number={2} text="Authenticate session" />
            <StepItem number={3} text="Enter executive workspace" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column (Sign In Form) */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
        >
          {/* Header */}
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-3xl font-medium tracking-tight text-white">Sign In to Workspace</h2>
            <p className="text-white/40 text-sm">Input your basic credentials to begin the journey.</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-2">
              <span className="text-red-400">⚠</span> {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-6 lg:space-y-4">
            <InputGroup
              label="Email or User ID"
              placeholder="founder@vexor.com or VXR26001"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              badge={identifier ? (isUserId ? 'USER ID' : 'EMAIL') : undefined}
            />

            <div className="space-y-1 relative">
              <InputGroup
                label="Password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <p className="text-white/20 text-[11px] mt-1 pl-1">Requires at least 8 symbols.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Workspace'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-white/40 hover:text-white text-sm transition-colors hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

    </main>
  );
}

// ─── Reusable StepItem Component ──────────────────────────────────────────
function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 ${
        active
          ? 'bg-white text-black border border-white shadow-lg'
          : 'bg-brand-gray text-white border border-transparent'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
          active ? 'bg-black text-white' : 'bg-white/10 text-white/40'
        }`}
      >
        {number}
      </div>
      <span className="text-sm font-medium tracking-tight">{text}</span>
    </div>
  );
}


// ─── Reusable InputGroup Component ────────────────────────────────────────
interface InputGroupProps {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  badge?: string;
}

function InputGroup({ label, placeholder, type, value, onChange, badge }: InputGroupProps) {
  return (
    <div className="flex flex-col gap-2 w-full relative">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white">{label}</label>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            {badge}
          </span>
        )}
      </div>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-brand-gray border border-transparent rounded-xl h-11 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 text-sm"
      />
    </div>
  );
}
