import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { FaArrowRight, FaChevronDown, FaXmark } from 'react-icons/fa6';

export interface Hero9NavItem {
  label: string;
  href: string;
  hasMenu?: boolean;
}

export interface Hero9Avatar {
  src: string;
  alt: string;
}

export interface Hero9Props {
  logo?: ReactNode;
  logoText?: string;
  navItems?: Hero9NavItem[];
  ctaText?: string;
  ctaHref?: string;
  eyebrowText?: string;
  avatars?: Hero9Avatar[];
  title?: string;
  description?: string;
  emailPlaceholder?: string;
  formAction?: string;
  submitText?: string;
  backgroundImage?: string;
  onOpenBooking?: () => void;
  renderCtaButton?: ReactNode;
  renderSubmitButton?: ReactNode;
  showHeader?: boolean;
}

const defaultNavItems: Hero9NavItem[] = [
  { label: 'Platform', href: '#platform' },
  { label: 'Candidate Entry', href: '#lead-management' },
  { label: 'Faculty Allocation', href: '#lead-assignment' },
  { label: 'Nora AI', href: '#nora-ai' },
  { label: 'Dual Campuses', href: '#multi-campus' },
];

const defaultAvatars: Hero9Avatar[] = [
  {
    src: 'https://assets.watermelon.sh/wm_ben.png',
    alt: 'SPHEREX user',
  },
  {
    src: 'https://assets.watermelon.sh/wm_alex.png',
    alt: 'SPHEREX user',
  },
  {
    src: 'https://assets.watermelon.sh/wm_olivia.png',
    alt: 'SPHEREX user',
  },
];

const defaultBackground = 'https://assets.watermelon.sh/hero-9-bg.avif';

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.68, bounce: 0, delay: 0.4 },
  },
};

const contentContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
      delay: 0.3,
    },
  },
};

const contentItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.72, bounce: 0 },
  },
};

const backgroundVariants: Variants = {
  hidden: { opacity: 0, scale: 1.035, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 1.15, bounce: 0 },
  },
};

function DefaultLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="SPHEREX" className="h-8 w-8 object-contain" />
    </div>
  );
}

export function Hero9({
  logo,
  logoText = 'SPHEREX',
  navItems = defaultNavItems,
  ctaText = 'Book Meeting',
  ctaHref = 'https://cal.com/sphere-x-5kss8s/30min',
  eyebrowText = 'SPHEREX • MULTI-CAMPUS ADMISSION MANAGEMENT OS • 2026–2027',
  avatars = defaultAvatars,
  title = 'Intelligent\nAdmission CRM &\nLead Management.',
  description = 'Automating institutional student intake across multiple campuses. Dynamic lead allocation to 16+ department heads with batch quota tracking, structured candidate registration, Nora AI cutoff evaluation, and WebRTC voice telephony.',
  emailPlaceholder = 'Enter your institutional email',
  formAction = '#',
  submitText = 'Get Started',
  backgroundImage = defaultBackground,
  onOpenBooking,
  renderCtaButton,
  renderSubmitButton,
  showHeader = true,
}: Hero9Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section 
      className="relative isolate w-full overflow-hidden font-sans text-slate-100 antialiased min-h-screen flex flex-col items-center justify-center pt-20 pb-10"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        paddingTop: '80px',
        paddingBottom: '40px'
      }}
    >
      <motion.div
        variants={backgroundVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="absolute inset-0 will-change-transform pointer-events-none"
        aria-hidden="true"
      >
        <img
          src={backgroundImage}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
      </motion.div>

      <div 
        className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center px-4 py-8 sm:px-8 text-center flex-1"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        {showHeader && (
          <motion.header
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.8 }}
            className="flex h-12 w-full items-center justify-between mb-8"
          >
            <a
              href="#"
              className="inline-flex min-h-10 items-center gap-2.5 text-white transition-[opacity,transform] duration-200 ease-out hover:opacity-75 active:scale-[0.96]"
            >
              {logo ?? <DefaultLogo />}
              <span className="text-lg leading-none font-semibold tracking-[-0.02em] bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                {logoText}
              </span>
            </a>

            <nav className="hidden items-center gap-[42px] lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group inline-flex min-h-10 items-center gap-1.5 text-sm leading-none font-medium text-slate-200 transition-colors duration-200 ease-out hover:text-cyan-400"
                >
                  <span>{item.label}</span>
                  {item.hasMenu ? (
                    <FaChevronDown className="size-2.5 transition-transform duration-200 group-hover:translate-y-px" />
                  ) : null}
                </a>
              ))}
            </nav>

            <div className="hidden sm:inline-flex items-center">
              {renderCtaButton ? (
                renderCtaButton
              ) : (
                <motion.a
                  href={ctaHref}
                  onClick={(e) => {
                    if (onOpenBooking) {
                      e.preventDefault();
                      onOpenBooking();
                    }
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-5 text-sm leading-none font-medium text-cyan-300 shadow-lg backdrop-blur-md transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-cyan-500/20 hover:border-cyan-400/50"
                >
                  <span>{ctaText}</span>
                  <FaArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.a>
              )}
            </div>

            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-slate-900/80 text-white border border-slate-700/50 shadow-md backdrop-blur-md transition-[background-color,transform] duration-200 ease-out hover:bg-slate-800 lg:hidden"
            >
              <span className="h-3.5 w-4 bg-[linear-gradient(to_bottom,currentColor_0_2px,transparent_2px_6px,currentColor_6px_8px,transparent_8px_12px,currentColor_12px_14px)]" />
            </button>
          </motion.header>
        )}

        {showHeader && (
          <AnimatePresence initial={false}>
            {mobileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                className="fixed inset-x-4 top-4 z-50 rounded-[28px] bg-slate-900/95 p-4 text-white shadow-2xl border border-slate-700/60 backdrop-blur-xl lg:hidden"
              >
                <div className="flex items-center justify-between pl-3">
                  <a href="#" className="inline-flex items-center gap-2.5">
                    {logo ?? <DefaultLogo />}
                    <span className="text-base font-semibold tracking-[-0.02em]">
                      {logoText}
                    </span>
                  </a>
                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex size-10 items-center justify-center rounded-full text-slate-300 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-800 active:scale-[0.96]"
                  >
                    <FaXmark className="size-4" />
                  </button>
                </div>

                <nav className="mt-5 grid gap-1">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm font-medium text-slate-200 transition-colors duration-200 ease-out hover:bg-slate-800"
                    >
                      <span>{item.label}</span>
                      {item.hasMenu ? <FaChevronDown className="size-3" /> : null}
                    </a>
                  ))}
                </nav>

                <div className="mt-4">
                  {renderCtaButton ? (
                    renderCtaButton
                  ) : (
                    <motion.a
                      href={ctaHref}
                      onClick={(e) => {
                        if (onOpenBooking) {
                          e.preventDefault();
                          onOpenBooking();
                        }
                        setMobileOpen(false);
                      }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 text-sm font-medium text-white transition-[background-color,transform] duration-200 ease-out hover:bg-cyan-500"
                    >
                      {ctaText}
                      <FaArrowRight className="size-3" />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.42 }}
          className="mx-auto flex w-full max-w-[840px] flex-col items-center justify-center text-center py-6 sm:py-10"
          style={{
            margin: '0 auto',
            width: '100%',
            maxWidth: '840px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <motion.div
            variants={contentItem}
            className="inline-flex min-h-7 items-center justify-center gap-2 rounded-full bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 text-xs leading-none font-semibold text-cyan-300 shadow-lg backdrop-blur-md text-center"
            style={{ margin: '0 auto', display: 'inline-flex' }}
          >
            <span className="flex -space-x-2">
              {avatars.map((avatar) => (
                <img
                  key={avatar.src}
                  src={avatar.src}
                  alt={avatar.alt}
                  className="size-5 rounded-full object-cover shadow-xs outline-1 -outline-offset-1 outline-white/20"
                />
              ))}
              <span className="grid size-5 -rotate-45 place-items-center rounded-full bg-cyan-500 text-slate-950">
                <FaArrowRight className="size-2.5" />
              </span>
            </span>
            <span>{eyebrowText}</span>
          </motion.div>

          <motion.h1
            variants={contentItem}
            className="mt-6 w-full max-w-[800px] text-[clamp(2.4rem,5.2vw,4.2rem)] leading-[1.08] font-bold tracking-[-0.04em] whitespace-pre-line text-white text-center mx-auto"
            style={{
              margin: '24px auto 0 auto',
              textAlign: 'center',
              width: '100%',
              maxWidth: '800px'
            }}
          >
            {title}
          </motion.h1>

          <motion.p
            variants={contentItem}
            className="mt-5 w-full max-w-[640px] text-[clamp(0.95rem,1.35vw,1.15rem)] leading-[1.65] font-normal whitespace-pre-line text-slate-300 text-center mx-auto"
            style={{
              margin: '20px auto 0 auto',
              textAlign: 'center',
              width: '100%',
              maxWidth: '640px'
            }}
          >
            {description}
          </motion.p>

          <motion.div 
            variants={contentItem} 
            className="mt-8 flex flex-row flex-wrap items-center justify-center gap-4 w-full mx-auto text-center"
            style={{
              margin: '32px auto 0 auto',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              textAlign: 'center'
            }}
          >
            {renderCtaButton ? (
              renderCtaButton
            ) : (
              <motion.form
                action={formAction}
                className="flex w-full max-w-md flex-col gap-1.5 rounded-[28px] bg-slate-900/60 p-1.5 shadow-xl border border-slate-700/50 backdrop-blur-md min-[430px]:flex-row min-[430px]:rounded-full mx-auto"
                style={{ margin: '0 auto' }}
              >
                <label htmlFor="hero9-email" className="sr-only">
                  Email
                </label>
                <input
                  id="hero9-email"
                  type="email"
                  placeholder={emailPlaceholder}
                  className="min-h-10 w-full min-w-0 flex-1 bg-transparent px-5 text-center text-sm font-medium text-white outline-none placeholder:text-slate-400 min-[430px]:text-left"
                />
                {renderSubmitButton ? (
                  renderSubmitButton
                ) : (
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    className="group inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-cyan-500 px-4 text-sm font-medium text-slate-950 shadow-md transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-cyan-400 min-[430px]:w-auto"
                  >
                    <span>{submitText}</span>
                    <FaArrowRight className="size-3 duration-200 group-hover:translate-x-0.5" />
                  </motion.button>
                )}
              </motion.form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
