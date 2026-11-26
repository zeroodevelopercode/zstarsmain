import { useState } from 'react'

const features = [
  { number: '01', title: 'Build freely', description: 'A clean starting point for your next idea.' },
  { number: '02', title: 'Move quickly', description: 'Powered by Vite with fast development updates.' },
  { number: '03', title: 'Make it yours', description: 'Shape the interface around your own vision.' },
]

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Zstars home">
          <span className="brand-mark">Z</span>
          <span>zstars<span className="muted">/main</span></span>
        </a>
        <span className="status"><i /> React + Vite starter</span>
      </header>

      <section className="hero">
        <p className="eyebrow">A NEW SPACE TO CREATE</p>
        <h1>Start with a spark.<br /><span>Build something great.</span></h1>
        <p className="intro">
          Your React workspace is ready. Make this project your own,
          one thoughtful step at a time.
        </p>
        <div className="actions">
          <a className="primary" href="https://vite.dev/guide/" target="_blank" rel="noreferrer">
            Explore Vite <span aria-hidden="true">↗</span>
          </a>
          <a className="secondary" href="https://react.dev/learn" target="_blank" rel="noreferrer">
            Learn React
          </a>
        </div>
      </section>

      <section className="feature-section" aria-labelledby="features-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE FOUNDATION</p>
            <h2 id="features-title">Everything starts here.</h2>
          </div>
          <span className="section-count">03 — 03</span>
        </div>
        <div className="features">
          {features.map((feature) => (
            <article className="feature" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Zstars</span>
        <button className="counter" onClick={() => setCount((value) => value + 1)}>
          Test interaction <span>{count}</span>
        </button>
        <span>Made to be yours.</span>
      </footer>
    </main>
  )
}