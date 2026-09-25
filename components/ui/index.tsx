'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';



export default function Auth11() {
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-neutral-200 antialiased selection:bg-white/20 selection:text-white lg:flex-row">
      {/* Left Image Panel */}
      <div className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2">
        {/* Background Image Wrapper */}
        <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl">
          <img
            src="https://assets.watermelon.sh/auth-11.avif"
            alt="Serene landscape with a lone tree"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/20 to-transparent" />

          {/* Bottom Content within the image */}
          <div className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-balance text-white md:text-4xl lg:text-5xl">
              Move fast. Feel Free
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
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[400px]"
        >
          {/* Titles */}
          <motion.div variants={itemVariants} className="mb-10 text-center">
            <h2 className="text-3xl leading-tight font-medium tracking-tight text-balance text-white md:text-[40px]">
              Create your own AI
              <br />
              workforce{' '}
              <span className="font-serif font-light italic">faster.</span>
            </h2>
          </motion.div>



          {/* Form */}
          <form className="flex flex-col gap-5">
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
                placeholder="Enter your email"
                className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3.5 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-neutral-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3.5 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
              />
            </motion.div>

            {/* Sign Up Button */}
            <motion.div variants={itemVariants} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-full bg-[#EAEAEA] py-3.5 text-sm font-medium text-black shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-transform hover:bg-white active:scale-[0.96]"
              >
                Create account
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-[13px] text-neutral-400"
          >
            Already have an account?{' '}
            <a href="#" className="font-bold text-white hover:underline">
              Log in
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
