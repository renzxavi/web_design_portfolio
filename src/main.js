import * as THREE from "three"
import "./style.css"

/* ═══════════════════════════════════════════════════════════════════════
   SUPABASE CONFIG
═══════════════════════════════════════════════════════════════════════ */
const SUPABASE_URL  = 'https://jecbmjrzvzofhovrgqau.supabase.co'
const SUPABASE_ANON = 'sb_publishable_D_yFRcefnZUkKn4BnAYgDg_cZ8Zk--O'

/* ═══════════════════════════════════════════════════════════════════════
   THREE.JS — RENDERER
═══════════════════════════════════════════════════════════════════════ */
const canvas   = document.querySelector("#webgl")
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x0a0700, 1)

const scene  = new THREE.Scene()
scene.fog    = new THREE.FogExp2(0x0a0700, 0.045)

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1.5, 9)
camera.lookAt(0, 0, 0)
scene.add(camera)

/* ═══════════════════════════════════════════════════════════════════════
   SERVICE NODE GRAPH DATA
═══════════════════════════════════════════════════════════════════════ */
const NODES = [
  { id: 0,  label: "API Gateway",   type: "core",  pos: [0,    0,    0   ], tech: "Node.js · Express"  },
  { id: 1,  label: "Auth Service",  type: "core",  pos: [-2.2, 0.8, -0.5], tech: "JWT · OAuth2"        },
  { id: 2,  label: "User Service",  type: "core",  pos: [2.0,  0.6, -0.8], tech: "REST · gRPC"         },
  { id: 3,  label: "Order Service", type: "core",  pos: [0.4, -1.4, -1.2], tech: "Event-driven"        },
  { id: 4,  label: "PostgreSQL",    type: "db",    pos: [-3.2,-0.6, -2.0], tech: "Primary DB"           },
  { id: 5,  label: "MongoDB",       type: "db",    pos: [3.1, -0.8, -2.2], tech: "Documents"            },
  { id: 6,  label: "TimescaleDB",   type: "db",    pos: [0.2, -2.8, -1.8], tech: "Metrics / TS"        },
  { id: 7,  label: "RabbitMQ",      type: "queue", pos: [-1.2, 2.0, -1.5], tech: "Message Broker"      },
  { id: 8,  label: "Worker Pool",   type: "queue", pos: [1.8,  2.2, -1.0], tech: "Bull · 8 workers"    },
  { id: 9,  label: "Redis",         type: "cache", pos: [-2.8, 1.4, -0.2], tech: "Cache · Sessions"    },
  { id: 10, label: "Stripe",        type: "ext",   pos: [3.4,  1.2, -0.4], tech: "Payments API"        },
  { id: 11, label: "SendGrid",      type: "ext",   pos: [2.6, -2.0, -0.6], tech: "Email"               },
  { id: 12, label: "S3",            type: "ext",   pos: [-1.6,-2.4, -0.4], tech: "Object Storage"      },
]

const EDGES = [
  [0,1],[0,2],[0,3],
  [1,9],[1,4],
  [2,4],[2,5],
  [3,6],[3,7],[3,11],[3,12],
  [7,8],[0,10],[8,5],[8,6],[2,9],
]

const TYPE_COLOR = { core:0xffb347, db:0xff6b35, queue:0xffd166, cache:0xe8a020, ext:0x8b6914 }
const TYPE_SIZE  = { core:0.14,     db:0.11,     queue:0.10,     cache:0.10,     ext:0.08     }

/* ═══════════════════════════════════════════════════════════════════════
   BUILD NODES
═══════════════════════════════════════════════════════════════════════ */
const nodeMeshes = []
const nodeGroup  = new THREE.Group()
scene.add(nodeGroup)

NODES.forEach(node => {
  const color = TYPE_COLOR[node.type]
  const size  = TYPE_SIZE[node.type]

  const glowGeo = new THREE.SphereGeometry(size * 2.8, 16, 16)
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.04 })
  const glow    = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(...node.pos)

  const geo  = new THREE.SphereGeometry(size, 20, 20)
  const mat  = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(...node.pos)
  mesh.userData = node

  if (node.type === "core") {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * 2.0, 0.008, 4, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
    )
    ring.rotation.x = Math.PI / 2
    mesh.add(ring)
  }

  nodeMeshes.push(mesh)
  nodeGroup.add(mesh)
  nodeGroup.add(glow)
})

/* ═══════════════════════════════════════════════════════════════════════
   BUILD EDGES
═══════════════════════════════════════════════════════════════════════ */
const edgeGroup = new THREE.Group()
scene.add(edgeGroup)

EDGES.forEach(([a, b]) => {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...NODES[a].pos),
    new THREE.Vector3(...NODES[b].pos),
  ])
  edgeGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.12 })))
})

/* ═══════════════════════════════════════════════════════════════════════
   SIGNAL PULSES
═══════════════════════════════════════════════════════════════════════ */
const pulses = EDGES.map(([a, b]) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffda80, transparent: true, opacity: 0.9 })
  )
  scene.add(mesh)
  return {
    mesh,
    posA:    new THREE.Vector3(...NODES[a].pos),
    posB:    new THREE.Vector3(...NODES[b].pos),
    t:       Math.random(),
    speed:   0.18 + Math.random() * 0.22,
    reverse: Math.random() > 0.5,
  }
})

/* ═══════════════════════════════════════════════════════════════════════
   DUST PARTICLES
═══════════════════════════════════════════════════════════════════════ */
const DUST = 600
const dPos = new Float32Array(DUST * 3)
for (let i = 0; i < DUST; i++) {
  dPos[i*3]   = (Math.random()-0.5)*20
  dPos[i*3+1] = (Math.random()-0.5)*14
  dPos[i*3+2] = (Math.random()-0.5)*14 - 2
}
const dGeo = new THREE.BufferGeometry()
dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3))
scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({ size:0.022, color:0xffb347, transparent:true, opacity:0.2, sizeAttenuation:true })))

/* ═══════════════════════════════════════════════════════════════════════
   LIGHTING
═══════════════════════════════════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0xffb347, 0.4))
const keyLight = new THREE.PointLight(0xffb347, 6, 18)
keyLight.position.set(2, 3, 5)
scene.add(keyLight)
const rimLight = new THREE.PointLight(0xff6b35, 3, 15)
rimLight.position.set(-4, -2, 2)
scene.add(rimLight)

/* ═══════════════════════════════════════════════════════════════════════
   DRAG ROTATION
═══════════════════════════════════════════════════════════════════════ */
const drag = { active: false, prevX: 0, prevY: 0 }
let rotX = 0, rotY = 0

const heroEl = document.querySelector('.hero')
heroEl.addEventListener("mousedown", e => { drag.active = true; drag.prevX = e.clientX; drag.prevY = e.clientY })
window.addEventListener("mouseup",   () => { drag.active = false })
window.addEventListener("mousemove", e => {
  if (!drag.active) return
  rotY += (e.clientX - drag.prevX) * 0.006
  rotX  = Math.max(-0.8, Math.min(0.8, rotX + (e.clientY - drag.prevY) * 0.004))
  drag.prevX = e.clientX; drag.prevY = e.clientY
})

/* ═══════════════════════════════════════════════════════════════════════
   RAYCASTER TOOLTIP
═══════════════════════════════════════════════════════════════════════ */
const raycaster = new THREE.Raycaster()
const mouseVec  = new THREE.Vector2()
const tooltipEl = document.getElementById("tooltip")
let   hoveredId = -1

window.addEventListener("mousemove", e => {
  mouseVec.x =  (e.clientX / window.innerWidth)  * 2 - 1
  mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1
  tooltipEl.style.left = (e.clientX + 16) + "px"
  tooltipEl.style.top  = (e.clientY - 10) + "px"
})

/* ═══════════════════════════════════════════════════════════════════════
   HUD
═══════════════════════════════════════════════════════════════════════ */
const uptimeEl = document.getElementById("uptime")
const memEl    = document.getElementById("mem")
const fpsEl    = document.getElementById("fps")
const startMs  = Date.now()
let   frames   = 0, lastFps = performance.now()

function fmtUptime(ms) {
  const s  = Math.floor(ms / 1000)
  const hh = String(Math.floor(s / 3600)).padStart(2,"0")
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2,"0")
  const ss = String(s % 60).padStart(2,"0")
  return `UP ${hh}:${mm}:${ss}`
}

/* ═══════════════════════════════════════════════════════════════════════
   RENDER LOOP
═══════════════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock()

function loop() {
  requestAnimationFrame(loop)
  const t  = clock.getElapsedTime()
  const gy = t * 0.04 + rotY
  const gx = rotX

  frames++
  if (performance.now() - lastFps > 1000) {
    fpsEl.textContent = frames + " FPS"; frames = 0; lastFps = performance.now()
  }
  uptimeEl.textContent = fmtUptime(Date.now() - startMs)
  memEl.textContent    = "MEM " + ((42 + Math.sin(t * 0.3) * 8) | 0) + "%"

  nodeGroup.rotation.y = gy; nodeGroup.rotation.x = gx
  edgeGroup.rotation.y = gy; edgeGroup.rotation.x = gx

  pulses.forEach(p => {
    p.t += p.speed * 0.004
    if (p.t > 1) p.t = 0
    const tt    = p.reverse ? 1 - p.t : p.t
    const local = new THREE.Vector3().lerpVectors(p.posA, p.posB, tt)
    local.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(gx, gy, 0, "XYZ")))
    p.mesh.position.copy(local)
  })

  nodeMeshes.forEach((mesh, i) => {
    mesh.material.emissiveIntensity = 0.4 + Math.sin(t * 1.1 + i * 0.8) * 0.22
  })

  raycaster.setFromCamera(mouseVec, camera)
  const hits = raycaster.intersectObjects(nodeMeshes)
  if (hits.length > 0) {
    const node = hits[0].object.userData
    if (node.id !== hoveredId) {
      hoveredId = node.id
      tooltipEl.innerHTML = `<div class="tooltip__name">${node.label}</div><div class="tooltip__meta">${node.tech}</div>`
      tooltipEl.classList.add("visible")
    }
  } else {
    hoveredId = -1
    tooltipEl.classList.remove("visible")
  }

  renderer.render(scene, camera)
}

loop()

/* ═══════════════════════════════════════════════════════════════════════
   RESIZE
═══════════════════════════════════════════════════════════════════════ */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add("visible"), i * 120)
      revealObs.unobserve(entry.target)
    }
  })
}, { threshold: 0.15 })

document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el))

/* ═══════════════════════════════════════════════════════════════════════
   ACTIVE NAV HIGHLIGHT
═══════════════════════════════════════════════════════════════════════ */
const sections = document.querySelectorAll("section[id], footer")
const navLinks = document.querySelectorAll(".tnav")

const navObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => {
        a.style.color = a.getAttribute("href") === "#" + entry.target.id
          ? "var(--amber)" : ""
      })
    }
  })
}, { threshold: 0.4 })

sections.forEach(s => navObs.observe(s))

/* ═══════════════════════════════════════════════════════════════════════
   SUPABASE CONTACT FORM
═══════════════════════════════════════════════════════════════════════ */
const form = document.getElementById("contactForm")
const btn  = form && form.querySelector("button[type='submit']")

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault()
    const name    = document.getElementById("fname").value.trim()
    const email   = document.getElementById("femail").value.trim()
    const message = document.getElementById("fmessage").value.trim()

    btn.textContent = "SENDING..."
    btn.disabled    = true

    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1/contacts", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Prefer":        "return=minimal",
        },
        body: JSON.stringify({ name, email, message }),
      })

      if (res.ok || res.status === 201 || res.status === 204) {
        showMsg("// MESSAGE TRANSMITTED. I'LL BE IN TOUCH SOON.", "success")
        form.reset()
      } else {
        const err = await res.json().catch(() => ({}))
        showMsg("// ERROR " + res.status + ": " + (err.message || "SOMETHING WENT WRONG."), "error")
      }
    } catch (err) {
      console.error("Supabase fetch error:", err)
      showMsg("// COULD NOT CONNECT. CHECK CONSOLE (F12).", "error")
    } finally {
      btn.textContent = "SEND MESSAGE →"
      btn.disabled    = false
    }
  })
}

function showMsg(text, type) {
  const el = document.getElementById("form-message")
  if (!el) return
  el.style.transition = ""
  el.style.opacity    = "1"
  el.textContent      = text
  el.className        = "form-msg " + type

  setTimeout(() => {
    el.style.transition = "opacity 0.4s"
    el.style.opacity    = "0"
    setTimeout(() => {
      el.className   = "form-msg"
      el.style       = ""
      el.textContent = ""
    }, 400)
  }, 6000)
}