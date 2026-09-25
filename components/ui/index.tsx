'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
export { Hero9 } from './hero9';
export type { Hero9Props, Hero9NavItem, Hero9Avatar } from './hero9';

export interface Auth11Props {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  leftHeadline?: string;
  leftImageSrc?: string;
  buttonText?: string;
  footerText?: React.ReactNode;
  onLoginSuccess?: (email: string) => void;
  onBackToHome?: () => void;
  showBackToHome?: boolean;
}

export default function Auth11({
  title,
  subtitle,
  leftHeadline = 'Move fast. Feel Free',
  leftImageSrc = 'https://assets.watermelon.sh/auth-11.avif',
  buttonText = 'Sign in',
  footerText,
  onLoginSuccess,
  onBackToHome,
  showBackToHome = true,
}: Auth11Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);

    // Simulate login authentication
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`Welcome back! Authenticated as ${email}`);
      if (onLoginSuccess) {
        onLoginSuccess(email);
      }
    }, 700);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-neutral-200 antialiased selection:bg-white/20 selection:text-white lg:flex-row">
      {/* Left Image Panel */}
      <div className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2">
        {/* Background Image Wrapper */}
        <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl">
          <img
            src={leftImageSrc}
            alt="Serene landscape with a lone tree"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark Gradient Overlay for text readability */}
          <div
            className="absolute inset-0 bg-gradient-to-t bg-linear-to-t from-[#050505] via-[#050505]/30 to-transparent"
            style={{
              background:
                'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.4) 45%, transparent 100%)',
            }}
          />

          {/* Bottom Content within the image */}
          <div className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-balance text-white md:text-4xl lg:text-5xl">
              {leftHeadline}
            </h1>
            {/* Pagination Indicators */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-1 w-6 rounded-full bg-white"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="relative flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        {/* Back to Home Button */}
        {showBackToHome && (
          <div className="absolute top-6 left-6 z-20">
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) {
                  onBackToHome();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-full border border-white/10 bg-[#0c0c0c] hover:bg-[#181818]"
            >
              &larr; Back to SPHEREX
            </button>
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[400px]"
        >
          {/* Titles */}
          <motion.div variants={itemVariants} className="mb-10 text-center">
            <h2 className="text-3xl leading-tight font-medium tracking-tight text-balance text-white md:text-[40px]">
              {title ?? (
                <>
                  Create your own AI
                  <br />
                  workforce{' '}
                  <span className="font-serif font-light italic">faster.</span>
                </>
              )}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
            )}
          </motion.div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/20 bg-red-950/40 p-3 text-center text-xs text-red-300"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3 text-center text-xs text-emerald-300"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3.5 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-200"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched to administrator.');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3.5 pr-11 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <FiEyeOff className="text-base" />
                  ) : (
                    <FiEye className="text-base" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Sign Up / Sign In Button */}
            <motion.div variants={itemVariants} className="mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#EAEAEA] py-3.5 text-sm font-medium text-black shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-transform hover:bg-white active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : buttonText}
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-[13px] text-neutral-400 text-center"
          >
            {footerText ?? (
              <>
                Already have an account?{' '}
                <a
                  href="#login"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('email')?.focus();
                  }}
                  className="font-bold text-white hover:underline"
                >
                  Log in
                </a>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export { Auth11 };
