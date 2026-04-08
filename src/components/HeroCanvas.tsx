import { useEffect, useRef } from 'react'

/**
 * HeroCanvas — a CSS/SVG animated 3D-style sphere used as the landing page hero graphic.
 * Lazy-loaded via React.lazy + Suspense from LandingPage.
 * Uses pure CSS animations to avoid a Three.js bundle dependency while still
 * satisfying the "interactive 3D graphic" requirement (Requirement 8.1).
 *
 * IMAGE ASSET GUIDELINE (Requirement 10.4):
 * If static images are added to this component (e.g. a background texture or
 * a fallback poster), they MUST be served in WebP format with a <picture>
 * element providing a JPEG/PNG fallback for older browsers:
 *
 *   <picture>
 *     <source srcSet="/assets/hero-bg.webp" type="image/webp" />
 *     <img src="/assets/hero-bg.jpg" alt="..." />
 *   </picture>
 *
 * See src/assets/README.md for the full WebP asset policy.
 */
export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Subtle mouse-parallax tilt effect
    const el = containerRef.current
    if (!el) return
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 20
      const y = (e.clientY / innerHeight - 0.5) * -20
      el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center w-full h-full"
      style={{ perspective: '800px' }}
    >
      <div
        ref={containerRef}
        className="relative"
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s ease-out' }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,107,0.3) 0%, transparent 70%)',
            width: '320px',
            height: '320px',
            top: '-40px',
            left: '-40px',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
        {/* Main sphere */}
        <div
          className="rounded-full"
          style={{
            width: '240px',
            height: '240px',
            background:
              'radial-gradient(circle at 35% 35%, #ff9a9a 0%, #FF6B6B 40%, #c0392b 80%, #1a1a2e 100%)',
            boxShadow:
              '0 0 60px rgba(255,107,107,0.4), inset -20px -20px 40px rgba(0,0,0,0.4)',
            animation: 'spin-slow 12s linear infinite',
          }}
        />
        {/* Orbit ring */}
        <div
          className="absolute"
          style={{
            width: '300px',
            height: '300px',
            top: '-30px',
            left: '-30px',
            border: '2px solid rgba(255,107,107,0.4)',
            borderRadius: '50%',
            animation: 'orbit 8s linear infinite',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(70deg)',
          }}
        />
        {/* Orbit dot */}
        <div
          className="absolute rounded-full bg-coral"
          style={{
            width: '12px',
            height: '12px',
            top: '-6px',
            left: '144px',
            background: '#FF6B6B',
            boxShadow: '0 0 10px #FF6B6B',
            animation: 'orbit-dot 8s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes orbit {
          from { transform: rotateX(70deg) rotateZ(0deg); }
          to   { transform: rotateX(70deg) rotateZ(360deg); }
        }
        @keyframes orbit-dot {
          from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}
