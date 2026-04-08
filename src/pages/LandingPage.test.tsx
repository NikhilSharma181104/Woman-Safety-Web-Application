import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

// Mock framer-motion to avoid animation/IntersectionObserver issues in jsdom
vi.mock('framer-motion', () => {
  const makeEl = (tag: string) => ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
    React.createElement(tag, props, children)
  return {
    motion: {
      div: makeEl('div'),
      h1: makeEl('h1'),
      p: makeEl('p'),
      nav: makeEl('nav'),
      section: makeEl('section'),
      span: makeEl('span'),
    },
    useInView: () => true,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  it('renders the hero heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('has a "Sign Up for Free" CTA link', () => {
    renderPage()
    const links = screen.getAllByRole('link', { name: /sign up for free/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('has a "See how it works" anchor', () => {
    renderPage()
    // The hero CTA is an <a> tag (not a router Link)
    expect(screen.getByText(/see how it works/i)).toBeInTheDocument()
  })

  it('contains SDG 5 (Gender Equality) content', () => {
    renderPage()
    expect(screen.getAllByText(/SDG 5/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Gender Equality/i)).toBeInTheDocument()
  })

  it('contains SDG 16 content', () => {
    renderPage()
    expect(screen.getAllByText(/SDG 16/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Peace, Justice/i)).toBeInTheDocument()
  })

  it('contains the SDG section heading', () => {
    renderPage()
    expect(screen.getByText(/Aligned with the UN Sustainable/i)).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    renderPage()
    expect(screen.getByText(/One-Tap SOS/i)).toBeInTheDocument()
    // getAllByText because the title may appear in multiple elements
    expect(screen.getAllByText(/Live Location Sharing/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Safe Check-In Timer/i)).toBeInTheDocument()
  })
})
