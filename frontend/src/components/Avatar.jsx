import React from 'react'
import { avatarColorFor, avatarInitial } from '../lib/avatar'

// Circular avatar: photo if available, otherwise first letter of
// username on a deterministic solid background color.
export default function Avatar({ user, photo, size = 40, style = {} }) {
  const src = photo ?? user?.profilePic ?? null
  const name = user?.name || 'User'
  const username = user?.username || user?.email?.split('@')[0] || 'user'
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} avatar`}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', ...style }}
      />
    )
  }
  return (
    <div
      aria-label={`${name} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColorFor(username || user?.id),
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: Math.round(size * 0.42),
        fontFamily: 'Sora, sans-serif',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {avatarInitial(name, username)}
    </div>
  )
}
