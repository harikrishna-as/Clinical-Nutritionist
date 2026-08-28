import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GEOMETRY_BY_DEPT = {
  icu: { type: 'icosahedron', color: 0xef4444 },
  eicu: { type: 'torus', color: 0xf97316 },
  sicu: { type: 'octahedron', color: 0xeab308 },
  micu: { type: 'sphere', color: 0x22c55e },
  ticu: { type: 'box', color: 0x06b6d4 },
  cicu: { type: 'heart', color: 0xec4899 },
  picu: { type: 'capsule', color: 0x818cf8 },
  ot: { type: 'cylinder', color: 0xa78bfa },
  pediatric: { type: 'dodecahedron', color: 0x34d399 },
  pregnancy: { type: 'torusKnot', color: 0xf472b6 },
  nicu: { type: 'sphere', color: 0x2dd4bf, wireframe: true },
  nephrology: { type: 'octahedron', color: 0x60a5fa },
  oncology: { type: 'tetrahedron', color: 0x8b5cf6 },
  diabetes: { type: 'cone', color: 0xf59e0b },
  geriatric: { type: 'box', color: 0x94a3b8 },
}

export default function DeptHeroThree({ dept, opacity = 0.55 }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 6
    camera.position.y = 0.6

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    mount.appendChild(renderer.domElement)

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const p1 = new THREE.PointLight(dept?.color || '#ffffff', 1.2, 20)
    p1.position.set(3, 3, 3)
    scene.add(p1)
    const p2 = new THREE.PointLight(0xffffff, 0.6, 20)
    p2.position.set(-3, -2, 2)
    scene.add(p2)

    const cfg = GEOMETRY_BY_DEPT[dept?.slug] || { type: 'icosahedron', color: dept?.color || '#60a5fa' }
    const col = new THREE.Color(cfg.color)

    let mesh
    let group = new THREE.Group()
    scene.add(group)

    const matOpts = {
      color: col,
      emissive: col,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.92,
      wireframe: !!cfg.wireframe,
    }

    if (cfg.type === 'icosahedron') {
      const g = new THREE.IcosahedronGeometry(1.4, 2)
      const m = new THREE.MeshPhongMaterial({ ...matOpts, wireframe: true })
      mesh = new THREE.Mesh(g, m)
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }))
      group.add(mesh)
      group.add(inner)
    } else if (cfg.type === 'torus') {
      const g = new THREE.TorusGeometry(1.2, 0.35, 16, 36)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'torusKnot') {
      const g = new THREE.TorusKnotGeometry(0.9, 0.28, 80, 16)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'box') {
      const g = new THREE.BoxGeometry(1.9, 1.9, 1.9)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ ...matOpts, wireframe: true }))
      group.add(mesh)
      const inner = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), new THREE.MeshPhongMaterial({ color: col, transparent: true, opacity: 0.22 }))
      group.add(inner)
    } else if (cfg.type === 'sphere') {
      const g = new THREE.SphereGeometry(1.3, 32, 32)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'octahedron') {
      const g = new THREE.OctahedronGeometry(1.5, 0)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'dodecahedron') {
      const g = new THREE.DodecahedronGeometry(1.3, 0)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ ...matOpts, wireframe: true }))
      group.add(mesh)
    } else if (cfg.type === 'tetrahedron') {
      const g = new THREE.TetrahedronGeometry(1.6, 0)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'capsule') {
      const g = new THREE.CapsuleGeometry(0.7, 1.4, 8, 16)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'cylinder') {
      const g = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 24)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'cone') {
      const g = new THREE.ConeGeometry(1.1, 1.9, 24)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    } else if (cfg.type === 'heart') {
      // extruded heart shape
      const shape = new THREE.Shape()
      shape.moveTo(0, 0.6)
      shape.bezierCurveTo(0.6, 1.1, 1.4, 0.6, 0, -0.9)
      shape.bezierCurveTo(-1.4, 0.6, -0.6, 1.1, 0, 0.6)
      const g = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 })
      g.center()
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.32 }))
      mesh.scale.set(1.3, 1.3, 1.3)
      group.add(mesh)
    } else {
      const g = new THREE.IcosahedronGeometry(1.3, 1)
      mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial(matOpts))
      group.add(mesh)
    }

    // particles
    const pGeo = new THREE.BufferGeometry()
    const pCount = 180
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 18
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 18
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ color: col, size: 0.03, transparent: true, opacity: 0.5 })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    // floating smaller orbs
    const orbs = []
    for (let i = 0; i < 6; i++) {
      const g = new THREE.SphereGeometry(0.08 + Math.random() * 0.07, 12, 12)
      const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })
      const o = new THREE.Mesh(g, m)
      o.userData = {
        r: 2.2 + Math.random() * 1.2,
        theta: (i / 6) * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
        yAmp: 0.4 + Math.random() * 0.6,
      }
      orbs.push(o)
      scene.add(o)
    }

    const clock = new THREE.Clock()
    let raf
    const animate = () => {
      const t = clock.getElapsedTime()
      group.rotation.y += 0.005
      group.rotation.x = Math.sin(t * 0.22) * 0.18
      group.position.y = Math.sin(t * 0.5) * 0.12
      points.rotation.y = t * 0.018
      orbs.forEach((o) => {
        o.userData.theta += 0.008 * o.userData.speed
        o.position.x = Math.cos(o.userData.theta) * o.userData.r
        o.position.z = Math.sin(o.userData.theta) * o.userData.r
        o.position.y = Math.sin(t * 0.7 + o.userData.theta) * o.userData.yAmp
      })
      // gentle camera sway
      camera.position.x = Math.sin(t * 0.12) * 0.4
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [dept?.slug, dept?.color])

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none' }} aria-hidden />
}
