import React, { useRef, useState } from 'react'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'

// San Rita / Podium signature: a pinned full-viewport statement whose words
// resolve one by one as the user scrolls. The section is taller than the
// viewport; the inner block sticks while each word of line 1, then line 2,
// snaps into full clarity. Scrolling back up reverses the sequence.
// Under prefers-reduced-motion both lines render statically.
export default function ScrollStatement({ lines }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  })

  // Words resolve early: while the section is still climbing from the bottom
  // of the screen. Line 1 completes by 0.28, line 2 by 0.5 of the entry
  // travel, so the statement is fully readable well before the pin ride ends.
  const words = lines.flatMap((l, li) =>
    l.words.map((w, wi) => ({
      key: `${li}-${wi}`,
      text: w,
      em: l.em ? l.em.includes(wi) : false,
      threshold: li === 0 ? 0.02 + (wi / l.words.length) * 0.26 : 0.12 + (wi / l.words.length) * 0.38,
    })),
  )

  const [shown, setShown] = useState(() => new Set())

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = new Set()
    for (let i = 0; i < words.length; i++) {
      if (p >= words[i].threshold) next.add(i)
    }
    if (p >= 0.98) {
      for (let i = 0; i < words.length; i++) next.add(i)
    }
    setShown(next)
  })

  if (prefersReduced) {
    return (
      <section className="statement statement--static" ref={ref}>
        <div className="statement-inner statement-inner--static">
          <span className="statement-kicker">01 / 02 The Standard</span>
          {lines.map((l, li) => (
            <p key={li} className="statement-line">
              {l.words.map((w, wi) => (
                <span key={wi} className={l.em && l.em.includes(wi) ? 'gradient-text' : ''}>
                  {w}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="statement" ref={ref}>
      <span className="statement-kicker statement-kicker--fixed">01 / 02 The Standard</span>
      <div className="statement-inner">
        {lines.map((l, li) => (
          <p key={li} className="statement-line">
            {l.words.map((w, wi) => {
              const idx = words.findIndex((f) => f.key === `${li}-${wi}`)
              const on = shown.has(idx)
              return (
                <span
                  key={`${li}-${wi}`}
                  className={l.em && l.em.includes(wi) ? 'statement-word gradient-text' : 'statement-word'}
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? 'none' : 'translateY(0.55em)',
                    filter: on ? 'blur(0px)' : 'blur(8px)',
                  }}
                >
                  {w}{' '}
                </span>
              )
            })}
          </p>
        ))}
      </div>
      <span className="statement-px">SCROLL TO RESOLVE</span>
    </section>
  )
}