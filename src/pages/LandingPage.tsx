import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'

// ─── Feature data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
    title: 'One-Tap SOS',
    description: 'A single tap sends your live GPS location and an emergency alert to every trusted contact — from any screen, in under a second.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    title: 'Live Location Sharing',
    description: 'Your coordinates stream to emergency contacts every 30 seconds while you need help. They always know exactly where you are.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Safe Check-In Timer',
    description: 'Set a countdown for your journey. If you don\'t check in on time, your contacts are alerted automatically — no action needed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: 'Trusted Contacts',
    description: 'Add up to 5 emergency contacts. They receive SMS alerts and push notifications the moment you need help.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'Secure & Private',
    description: 'End-to-end encrypted. Your data is yours — row-level security ensures only you and your contacts can access your information.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    ),
    title: 'Works on Any Device',
    description: 'A fully responsive web app — no download required. Access all safety features from your phone, tablet, or desktop.',
  },
]

// ─── Stat data ────────────────────────────────────────────────────────────────

const stats = [
  { value: '1 tap', label: 'to trigger an SOS alert' },
  { value: '< 10s', label: 'alert delivery time' },
  { value: '30s', label: 'location update interval' },
  { value: '5', label: 'trusted contacts supported' },
]

// ─── Animated section wrapper (simplified, less animation fatigue) ────────────

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  
  // Disable animations on mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  if (isMobile) {
    return <div ref={ref} className={className}>{children}</div>
  }
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-slate-900 font-bold text-xl tracking-tight">
          Safe<span className="text-brand-primary">T</span>Net
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="btn btn-primary px-6 py-3 text-base"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-slate-50 text-slate-800 overflow-x-hidden">
      <Navbar />

      {/* ── HERO — static subtle background ─────────────────────── */}
      <section 
        id="main-content"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      >
        {/* Subtle static background */}
        <div 
          className="absolute inset-0 bg-slate-50"
          aria-hidden="true"
        />

        {/* Decorative subtle accent */}
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl"
          aria-hidden="true"
        />

        {/* Hero content - Two column layout */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-600 mb-8 shadow-soft"
            >
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              SDG 5 · SDG 16 · Women's Safety
            </motion.div>

            {/* Headline - capped at 6xl for mobile */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6"
            >
              Your safety,{' '}
              <span className="text-brand-primary">
                always
              </span>
              <br />
              within reach.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Real-time emergency alerts, live location sharing, and smart check-in timers —
              all in one tap.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <Link
                to="/signup"
                aria-label="Sign up for SafeTNet"
                className="btn btn-primary px-8 py-4 text-lg group"
              >
                Sign Up for Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Learn more about SafeTNet features"
                className="btn btn-secondary px-6 py-4 text-lg"
              >
                See how it works
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-8 text-slate-500 text-sm"
            >
              Join thousands of women staying safer every day
            </motion.p>
          </div>

          {/* Right column - Woman illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            {/* Decorative background circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-light to-brand-primary/10 rounded-full blur-3xl opacity-30" aria-hidden="true" />
            
            {/* Woman illustration */}
            <div className="relative">
              <img
                src="/hero-woman.png"
                alt="Woman using smartphone safely"
                className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl"
                loading="eager"
              />
            </div>

            {/* Floating elements for visual interest */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 w-16 h-16 bg-brand-primary/20 rounded-full blur-xl"
              aria-hidden="true"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 left-10 w-20 h-20 bg-brand-secondary/20 rounded-full blur-xl"
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.12} className="text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">{s.value}</div>
              <div className="text-sm text-slate-500 uppercase tracking-wide">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES (lazy loaded below fold) ────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="text-center mb-16">
            <p className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Everything you need to stay safe
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Built for real emergencies. Designed to be invisible until you need it.
            </p>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.12}>
                <div className="card p-6 h-full group hover:border-brand-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-16">
            <p className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Three steps to safety</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Add your contacts', body: 'Add up to 5 trusted people who will be notified in an emergency.' },
              { step: '02', title: 'Enable location', body: 'Grant location permission once. SafeTNet only activates it when you need it.' },
              { step: '03', title: 'Tap SOS when needed', body: 'One tap sends alerts with your live location to all your contacts instantly.' },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.15}>
                <div className="relative pl-6 border-l-2 border-brand-primary/20">
                  <p className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-2">{item.step}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDG SECTION ───────────────────────────────────────────────── */}
      <section id="sdg" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <p className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-3">Purpose-driven</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Aligned with the UN Sustainable Development Goals
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                num: '5',
                color: '#F4A261',
                title: 'Gender Equality',
                body: 'SafeTNet empowers women with real-time safety tools, reducing vulnerability to gender-based violence and enabling faster emergency response.',
              },
              {
                num: '16',
                color: '#457B9D',
                title: 'Peace, Justice & Strong Institutions',
                body: 'By facilitating rapid incident reporting and evidence-based location data, SafeTNet promotes safer communities and stronger protective institutions.',
              },
            ].map((sdg, i) => (
              <FadeIn key={sdg.num} delay={i * 0.12}>
                <div className="card p-8 flex gap-5">
                  <div
                    className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-soft"
                    style={{ backgroundColor: sdg.color }}
                    aria-label={`SDG ${sdg.num}`}
                  >
                    {sdg.num}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">SDG {sdg.num}</p>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{sdg.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{sdg.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">WCAG AA compliant</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-sm font-semibold">99.9% uptime</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden bg-slate-50">
        <FadeIn className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Ready to feel safer?
          </h2>
          <p className="text-slate-600 text-lg mb-10">
            Free to use. No app download required. Set up in under 2 minutes.
          </p>
          <Link
            to="/signup"
            aria-label="Sign up for SafeTNet"
            className="btn btn-primary px-10 py-5 text-lg inline-flex"
          >
            Sign Up for Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="mt-6 text-slate-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary hover:text-brand-dark font-semibold underline underline-offset-2 transition-colors">
              Log in
            </Link>
          </p>
        </FadeIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-slate-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} SafeTNet · Built for SDG 5 & SDG 16
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy" className="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                Terms of Service
              </Link>
              <Link to="/security" className="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
