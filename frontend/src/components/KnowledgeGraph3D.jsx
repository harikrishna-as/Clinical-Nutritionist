import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { api } from '../api'

const NODE_RADIUS = {
  disease: 0.55,
  nutrient: 0.4,
  food: 0.3,
}

const NODE_COLORS = {
  disease: 0xef4444,
  nutrient: 0x22c55e,
  food: 0xf5b041,
}

export default function KnowledgeGraph3D() {
  const mountRef = useRef(null)
  const [graphData, setGraphData] = useState(null)
  const [hovered, setHovered] = useState(null)
  const hoverRef = useRef(null)

  useEffect(() => {
    api.knowledgeGraph()
      .then((data) => setGraphData(data))
      .catch(() => setGraphData(null))
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !graphData) return
    const { nodes, edges } = graphData
    if (!nodes || !edges) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
    camera.position.set(0, 2, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const pl = new THREE.PointLight(0x8b5cf6, 1.4, 40)
    pl.position.set(4, 6, 8)
    scene.add(pl)

    // stable layout: ring presets + Fruchterman-Reingold style relaxation
    // (repulsion falls off with distance, attraction grows, cooled temperature -> converges)
    const pos = new Map()
    const nodeIndex = new Map()
    nodes.forEach((n, i) => {
      pos.set(n.id, { x: 0, y: 0, z: 0 })
      nodeIndex.set(n.id, i)
    })

    // Pre-set positions by type rings for a clean initial layout
    const byType = { disease: [], nutrient: [], food: [] }
    nodes.forEach((n) => byType[n.type]?.push(n))
    const ringRadii = { disease: 0, nutrient: 3.6, food: 6.6 }
    const counts = { disease: byType.disease.length || 1, nutrient: byType.nutrient.length || 1, food: byType.food.length || 1 }
    Object.entries(byType).forEach(([type, list]) => {
      list.forEach((n, i) => {
        const angle = (i / counts[type]) * Math.PI * 2
        pos.set(n.id, {
          x: Math.cos(angle) * ringRadii[type],
          y: type === 'disease' ? 0 : 0.35,
          z: Math.sin(angle) * ringRadii[type],
        })
      })
    })

    // small jitter so nodes don't sit exactly on top of each other
    nodes.forEach((n) => {
      const p = pos.get(n.id)
      p.x += (Math.random() - 0.5) * 0.4
      p.z += (Math.random() - 0.5) * 0.4
    })

    // Fruchterman-Reingold: k = ideal edge length, cooled temperature
    const k = 2.2
    let temperature = 1.2
    for (let it = 0; it < 70; it++) {
      const disp = {}
      nodes.forEach((n) => { disp[n.id] = { x: 0, y: 0, z: 0 } })
      // repulsion: k^2 / dist (decays with distance -> stable)
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const na = nodes[a]
          const nb = nodes[b]
          const pa = pos.get(na.id)
          const pb = pos.get(nb.id)
          let dx = pa.x - pb.x
          let dy = pa.y - pb.y
          let dz = pa.z - pb.z
          let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
          dx /= dist; dy /= dist; dz /= dist
          const rep = (k * k) / dist
          disp[na.id].x += dx * rep
          disp[na.id].y += dy * rep
          disp[na.id].z += dz * rep
          disp[nb.id].x -= dx * rep
          disp[nb.id].y -= dy * rep
          disp[nb.id].z -= dz * rep
        }
      }
      // attraction on edges: dist^2 / k (pulls linked nodes together)
      edges.forEach((e) => {
        const a = nodeIndex.get(e.source)
        const b = nodeIndex.get(e.target)
        if (a === undefined || b === undefined) return
        const pa = pos.get(nodes[a].id)
        const pb = pos.get(nodes[b].id)
        let dx = pa.x - pb.x
        let dy = pa.y - pb.y
        let dz = pa.z - pb.z
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        dx /= dist; dy /= dist; dz /= dist
        const attr = (dist * dist) / k
        disp[nodes[a].id].x -= dx * attr
        disp[nodes[a].id].y -= dy * attr
        disp[nodes[a].id].z -= dz * attr
        disp[nodes[b].id].x += dx * attr
        disp[nodes[b].id].y += dy * attr
        disp[nodes[b].id].z += dz * attr
      })
      // apply with temperature cap and cool down
      nodes.forEach((n) => {
        const p = pos.get(n.id)
        const d = disp[n.id]
        const len = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) || 0.01
        const capped = Math.min(len, temperature)
        p.x += (d.x / len) * capped
        p.y += (d.y / len) * capped
        p.z += (d.z / len) * capped
      })
      temperature *= 0.92
    }

    // fit camera to graph extent
    let maxRadius = 4
    nodes.forEach((n) => {
      const p = pos.get(n.id)
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
      if (r > maxRadius) maxRadius = r
    })
    const camDistance = maxRadius * 2.1

    // create sphere meshes
    const meshList = []
    nodes.forEach((n) => {
      const p = pos.get(n.id)
      const geo = new THREE.SphereGeometry(NODE_RADIUS[n.type] || 0.35, 20, 20)
      const mat = new THREE.MeshPhongMaterial({
        color: n.color ? parseInt(n.color.replace('#', ''), 16) : NODE_COLORS[n.type],
        emissive: NODE_COLORS[n.type],
        emissiveIntensity: 0.35,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(p.x, p.y, p.z)
      mesh.userData = n
      scene.add(mesh)
      meshList.push(mesh)
    })

    // create edge lines
    edges.forEach((e) => {
      const pa = pos.get(e.source)
      const pb = pos.get(e.target)
      if (!pa || !pb) return
      const pts = [new THREE.Vector3(pa.x, pa.y, pa.z), new THREE.Vector3(pb.x, pb.y, pb.z)]
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.35,
      })
      scene.add(new THREE.Line(geo, mat))
    })

    // starfield
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 40
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 40
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xc084fc, size: 0.02, transparent: true, opacity: 0.5 })))

    // raycaster for hover
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    mount.addEventListener('mousemove', onMouseMove)

    let isDragging = false
    let prevX = 0
    let targetRotY = 0
    let currentRotY = 0

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX }
    const onMouseUp = () => { isDragging = false }
    const onMouseMoveDrag = (e) => {
      if (isDragging) {
        targetRotY += (e.clientX - prevX) * 0.005
        prevX = e.clientX
      }
    }
    mount.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    mount.addEventListener('mousemove', onMouseMoveDrag)

    const clock = new THREE.Clock()
    let raf
    const animate = () => {
      const t = clock.getElapsedTime()
      currentRotY += (targetRotY - currentRotY) * 0.1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshList)
      if (hits.length > 0) {
        const n = hits[0].object.userData
        if (hoverRef.current?.id !== n.id) {
          hoverRef.current = n
          setHovered(n)
        }
      } else {
        if (hoverRef.current) {
          hoverRef.current = null
          setHovered(null)
        }
      }

      meshList.forEach((m) => {
        m.rotation.x = t * 0.3
        m.rotation.y = t * 0.5
        const p = pos.get(m.userData.id)
        const world = m.position.clone()
        world.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRotY)
        const scale = hoverRef.current?.id === m.userData.id ? 1.6 : 1
        m.scale.setScalar(scale)
      })

      camera.position.x = Math.sin(currentRotY) * camDistance
      camera.position.z = Math.cos(currentRotY) * camDistance
      camera.position.y = camDistance * 0.45
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      mount.removeEventListener('mousemove', onMouseMoveDrag)
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [graphData])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '520px', cursor: 'grab' }} />
      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            background: 'rgba(30,41,59,0.95)',
            border: '1px solid rgba(96,165,250,0.5)',
            borderRadius: 12,
            padding: '12px 18px',
            zIndex: 5,
            fontSize: 14,
          }}
        >
          <strong style={{ color: '#A78BFA', textTransform: 'capitalize' }}>{hovered.label}</strong>
          <span style={{ color: '#94A3B8', marginLeft: 8, fontSize: 12 }}>[{hovered.type}]</span>
        </div>
      )}
      {!graphData && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
          Loading knowledge graph...
        </div>
      )}
    </div>
  )
}
