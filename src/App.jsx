import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Terminal, Globe2, Briefcase, Brain, ChevronDown,
  Github, Linkedin, Mail, MapPin, Calendar, Award, Cpu, Code2,
  Server, Gamepad2, X, RotateCcw, Trophy,
  Clock, ArrowRight, Layers,
} from 'lucide-react'

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

function seededRandom(seed) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function getTodaySeed() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function generateSudoku() {
  const rng = seededRandom(getTodaySeed())
  const base = [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]
  const swap = (a, i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t }
  if (rng() > 0.5) swap(base, 0, 1)
  if (rng() > 0.5) swap(base, 2, 3)
  const solution = rng() > 0.5 ? base.map((_, i) => base.map(c => c[i])) : base
  const perm = [1, 2, 3, 4].sort(() => rng() - 0.5)
  const mapped = solution.map(r => r.map(v => perm[v - 1]))
  const puzzle = mapped.map(r => [...r])
  const removals = 8 + Math.floor(rng() * 3)
  let removed = 0
  while (removed < removals) {
    const r = Math.floor(rng() * 4), c = Math.floor(rng() * 4)
    if (puzzle[r][c] !== 0) { puzzle[r][c] = 0; removed++ }
  }
  return { puzzle, solution: mapped }
}

function useTyping(text, speed = 40, delay = 0) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    let i = 0; setDisplay('')
    const timeout = setTimeout(() => {
      const iv = setInterval(() => {
        i++; setDisplay(text.slice(0, i))
        if (i >= text.length) clearInterval(iv)
      }, speed)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, speed, delay])
  return display
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

function Section({ id, children, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section id={id} ref={ref} className={className}
      initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={stagger}>
      {children}
    </motion.section>
  )
}

/* ═══════════════════════════════════════════
   GLOBE CANVAS — COUNTRY HIGHLIGHTS
   ═══════════════════════════════════════════ */

function GlobeCanvas({ size = 380 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const rotRef = useRef(-30)
  const dragRef = useRef({ dragging: false, lastX: 0 })

  const workMarkers = [
    { lat: 17.4, lng: 78.5, label: 'Hyderabad', color: '#00e87b' },
    { lat: 45.43, lng: 4.39, label: 'Saint-Étienne', color: '#3b82f6' },
  ]

  const countries = {
    india:       { color: '#00e87b', points: [[8,77],[10,76],[13,74],[16,73],[20,73],[23,70],[24,69],[27,70],[30,75],[33,76],[35,77],[30,82],[25,88],[22,90],[21,87],[16,82],[12,80],[8,77]] },
    france:      { color: '#3b82f6', points: [[43,5],[44,-1],[46,-2],[48,-4],[49,0],[51,2],[50,5],[49,7],[48,8],[47,7],[46,6],[44,7],[43,7],[43,5]] },
    italy:       { color: '#a78bfa', points: [[47,7],[46,11],[45,12],[44,12],[43,16],[42,15],[41,16],[40,18],[39,16],[38,16],[37,15],[38,13],[40,16],[41,14],[42,12],[44,12],[45,11],[46,10],[46,7],[47,7]] },
    spain:       { color: '#f59e0b', points: [[43,-9],[43,-2],[43,3],[42,3],[40,4],[38,0],[37,-2],[37,-6],[37,-9],[39,-9],[41,-9],[43,-9]] },
    switzerland: { color: '#ef4444', points: [[46,6],[47,6],[47.5,8],[47.5,10],[47,10],[46.5,9],[46,8],[46,6]] },
    germany:     { color: '#06b6d4', points: [[47,6],[47,10],[48,12],[49,13],[51,12],[53,10],[54,9],[54,11],[53,13],[51,14],[50,12],[49,10],[48,7],[47,6]] },
    monaco:      { color: '#ec4899', points: [[43.73,7.41],[43.74,7.42],[43.73,7.43],[43.72,7.42],[43.73,7.41]] },
  }

  const project = useCallback((lat, lng, rot, R) => {
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + rot) * Math.PI / 180
    const x = R * Math.sin(phi) * Math.cos(theta)
    const y = R * Math.cos(phi)
    const z = R * Math.sin(phi) * Math.sin(theta)
    return { x: size / 2 + x, y: size / 2 - y, z, visible: z > -10 }
  }, [size])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const R = size * 0.38

    const draw = () => {
      const rot = rotRef.current
      ctx.clearRect(0, 0, size, size)

      // Ambient glow
      const grd = ctx.createRadialGradient(size/2, size/2, R*0.8, size/2, size/2, R*1.3)
      grd.addColorStop(0, 'rgba(0,232,123,0.05)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd; ctx.fillRect(0, 0, size, size)

      // Outline
      ctx.beginPath(); ctx.arc(size/2, size/2, R, 0, Math.PI*2)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5; ctx.stroke()

      // Grid
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); let first = true
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = project(lat, lng, rot, R)
          if (p.visible) { if (first) { ctx.moveTo(p.x, p.y); first = false } else ctx.lineTo(p.x, p.y) } else first = true
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke()
      }
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath(); let first = true
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lng, rot, R)
          if (p.visible) { if (first) { ctx.moveTo(p.x, p.y); first = false } else ctx.lineTo(p.x, p.y) } else first = true
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke()
      }

      // Background continents
      const bgContinents = [
        [[36,10],[33,12],[30,32],[20,38],[10,42],[0,42],[-5,40],[-10,40],[-15,35],[-25,33],[-34,26],[-34,18],[-25,15],[-15,12],[-5,10],[0,2],[5,-5],[10,-15],[15,-17],[20,-17],[25,-15],[30,-10],[33,10],[36,10]],
        [[70,-60],[65,-65],[55,-60],[45,-65],[40,-75],[30,-82],[25,-80],[20,-75],[10,-75],[5,-78],[0,-80],[-5,-80],[-15,-75],[-20,-70],[-30,-70],[-40,-65],[-50,-70],[-55,-67]],
      ]
      bgContinents.forEach(pts => {
        ctx.beginPath(); let first = true
        pts.forEach(([lat,lng]) => { const p = project(lat, lng, rot, R); if (p.visible) { if (first) { ctx.moveTo(p.x, p.y); first = false } else ctx.lineTo(p.x, p.y) } else first = true })
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.8; ctx.stroke()
      })

      // Highlighted countries
      Object.values(countries).forEach(country => {
        ctx.beginPath(); let first = true; let anyVisible = false
        country.points.forEach(([lat,lng]) => { const p = project(lat, lng, rot, R); if (p.visible) { anyVisible = true; if (first) { ctx.moveTo(p.x, p.y); first = false } else ctx.lineTo(p.x, p.y) } else first = true })
        if (anyVisible) { ctx.closePath(); ctx.fillStyle = country.color + '25'; ctx.fill(); ctx.strokeStyle = country.color + '80'; ctx.lineWidth = 1.5; ctx.stroke() }
      })

      // Work markers
      workMarkers.forEach(m => {
        const p = project(m.lat, m.lng, rot, R)
        if (!p.visible) return
        const mg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18)
        mg.addColorStop(0, m.color + '88'); mg.addColorStop(1, m.color + '00')
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fillStyle = m.color; ctx.fill()
        const pulse = (Date.now() % 2000) / 2000
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 + pulse * 16, 0, Math.PI*2)
        ctx.strokeStyle = m.color + Math.round((1-pulse)*80).toString(16).padStart(2,'0')
        ctx.lineWidth = 1.5; ctx.stroke()
        ctx.font = 'bold 11px "JetBrains Mono", monospace'
        ctx.fillStyle = m.color; ctx.fillText(m.label, p.x + 12, p.y + 4)
      })

      if (!dragRef.current.dragging) rotRef.current += 0.12
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [size, project])

  return (
    <canvas ref={canvasRef} width={size} height={size}
      className="cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={e => { dragRef.current = { dragging: true, lastX: e.clientX } }}
      onPointerMove={e => { if (!dragRef.current.dragging) return; rotRef.current += (e.clientX - dragRef.current.lastX) * 0.3; dragRef.current.lastX = e.clientX }}
      onPointerUp={() => { dragRef.current.dragging = false }}
      onPointerLeave={() => { dragRef.current.dragging = false }}
    />
  )
}

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const skills = {
  languages: ['C++', 'Python', 'JavaScript', 'SQL', 'Bash'],
  ml: ['PyTorch', 'TensorFlow', 'Pandas', 'NumPy', 'Scikit-learn', 'OpenCV'],
  web: ['React', 'Node.js', 'Tailwind CSS', 'Express', 'REST APIs'],
  data: ['PostgreSQL', 'MongoDB', 'Redis', 'Firebase'],
  tools: ['Git', 'Docker', 'Linux', 'VS Code', 'Blender', 'MATLAB'],
}

const timeline = [
  { date: 'Summer 2026', title: 'Summer Analyst Intern', org: 'Goldman Sachs',
    desc: 'Incoming Summer Analyst Intern at Goldman Sachs.',
    color: '#3b82f6', icon: <Briefcase size={18} />, upcoming: true },
  { date: 'Jan 2026 – April 2026', title: 'ML Research Intern', org: 'CNRS, France',
    desc: 'Medical imaging research and economic simulation at GATE laboratory. Deep learning for clinical diagnostics, agent-based modeling, and Set Transformer research.',
    color: '#00e87b', icon: <Brain size={18} /> },
  { date: '2023 – 2027', title: 'B.Tech Student', org: 'IIT Hyderabad',
    desc: 'Engineering Physics & Biomedical Engineering. Focus on machine learning, algorithms, and software development.',
    color: '#a78bfa', icon: <Award size={18} /> },
]

const projects = [
  { title: 'Set Transformer Research', tags: ['Set Transformer', 'Attention', 'CNRS'],
    desc: 'Research on Set Transformer architectures at CNRS Saint-Étienne. Permutation-invariant models with multi-head attention for set-structured data in medical and economic domains.',
    color: '#3b82f6', icon: <Layers size={20} /> },
  { title: 'AI Prosthetic Hand', tags: ['EMG Signals', 'CNN', 'Real-time'],
    desc: 'Neural-interface prosthetic using EMG signal classification for real-time gesture recognition. 96% accuracy on 8-gesture classification.',
    color: '#00e87b', icon: <Cpu size={20} /> },
  { title: 'Robotic Ultrasound Navigation', tags: ['RL', 'CNN', 'Robotics'],
    desc: 'Reinforcement learning pipeline for autonomous ultrasound probe navigation. CNN feature extraction with PPO policy optimization.',
    color: '#a78bfa', icon: <Server size={20} /> },
  { title: 'Brain Tumor Segmentation', tags: ['U-Net', 'MRI', '92% Dice'],
    desc: 'Modified U-Net with attention gates for multi-class brain tumor segmentation on BraTS dataset. 92% Dice coefficient.',
    color: '#f59e0b', icon: <Brain size={20} /> },
]

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */

export default function App() {
  const [activeSection, setActiveSection] = useState('hero')
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: "parth@portfolio:~$ Welcome. Type 'help' for commands." },
  ])
  const [sudoku, setSudoku] = useState(() => {
    const { puzzle, solution } = generateSudoku()
    return { puzzle, solution, current: puzzle.map(r => [...r]), selected: null, errors: new Set(), solved: false, started: false, startTime: null, elapsed: 0 }
  })
  const termRef = useRef(null)
  const timerRef = useRef(null)

  const navItems = [
    { id: 'hero', label: 'Home' }, { id: 'terminal', label: 'Stack' },
    { id: 'globe', label: 'Map' }, { id: 'timeline', label: 'Journey' },
    { id: 'projects', label: 'Work' }, { id: 'sudoku', label: 'Game' },
  ]

  // Scroll tracker
  useEffect(() => {
    const handler = () => {
      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i].id)
        if (el && el.getBoundingClientRect().top < 200) { setActiveSection(navItems[i].id); break }
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Sudoku timer — starts on first cell click
  useEffect(() => {
    if (!sudoku.started || sudoku.solved) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSudoku(s => ({ ...s, elapsed: Math.floor((Date.now() - s.startTime) / 1000) }))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [sudoku.started, sudoku.solved])

  const handleTerminal = (cmd) => {
    const c = cmd.trim().toLowerCase()
    let output = []
    if (c === 'help') output = [{ type: 'info', text: 'Commands: skills, languages, ml, web, data, tools, about, contact, clear' }]
    else if (c === 'clear') { setTerminalHistory([{ type: 'system', text: 'parth@portfolio:~$ Cleared.' }]); return }
    else if (c === 'about') output = [{ type: 'success', text: 'Parth Dawar — ML Researcher @ CNRS | Incoming GS Summer Analyst Intern | IIT Hyderabad' }]
    else if (c === 'contact') output = [{ type: 'info', text: '→ github.com/parthdawar | linkedin.com/in/parthdawar' }]
    else if (c === 'skills' || c === 'all') output = Object.entries(skills).map(([k, v]) => ({ type: 'success', text: `[${k.toUpperCase()}] ${v.join(' · ')}` }))
    else if (skills[c]) output = [{ type: 'success', text: `[${c.toUpperCase()}] ${skills[c].join(' · ')}` }]
    else output = [{ type: 'error', text: `Command not found: '${cmd}'. Type 'help'.` }]
    setTerminalHistory(h => [...h, { type: 'input', text: `parth@portfolio:~$ ${cmd}` }, ...output])
    setTimeout(() => { termRef.current?.scrollTo({ top: termRef.current.scrollHeight, behavior: 'smooth' }) }, 50)
  }

  const handleSudokuCell = (r, c) => {
    if (sudoku.puzzle[r][c] !== 0 || sudoku.solved) return
    setSudoku(s => ({ ...s, selected: [r, c], started: true, startTime: s.startTime || Date.now() }))
  }

  const handleSudokuInput = (num) => {
    if (!sudoku.selected || sudoku.solved) return
    const [r, c] = sudoku.selected
    if (sudoku.puzzle[r][c] !== 0) return
    const next = sudoku.current.map(row => [...row])
    next[r][c] = num
    const errors = new Set()
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if (next[i][j] === 0) continue
      for (let k = 0; k < 4; k++) { if (k !== j && next[i][k] === next[i][j]) { errors.add(`${i},${j}`); errors.add(`${i},${k}`) } }
      for (let k = 0; k < 4; k++) { if (k !== i && next[k][j] === next[i][j]) { errors.add(`${i},${j}`); errors.add(`${k},${j}`) } }
      const br = Math.floor(i/2)*2, bc = Math.floor(j/2)*2
      for (let di=0;di<2;di++) for (let dj=0;dj<2;dj++) {
        const ni=br+di,nj=bc+dj
        if ((ni!==i||nj!==j) && next[ni][nj]===next[i][j]) { errors.add(`${i},${j}`); errors.add(`${ni},${nj}`) }
      }
    }
    const solved = errors.size === 0 && next.every(row => row.every(v => v !== 0))
    setSudoku(s => ({ ...s, current: next, errors, solved }))
  }

  const resetSudoku = () => {
    const { puzzle, solution } = generateSudoku()
    setSudoku({ puzzle, solution, current: puzzle.map(r => [...r]), selected: null, errors: new Set(), solved: false, started: false, startTime: null, elapsed: 0 })
  }

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const heroText = useTyping('Engineering the Convergence of AI & Biomedicine', 35, 300)

  return (
    <div className="font-mono min-h-screen overflow-x-hidden bg-[#060608] text-zinc-200">

      {/* ─── NAV ─── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#060608]/75 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span onClick={() => scrollTo('hero')} className="text-[#00e87b] font-bold text-lg tracking-tight cursor-pointer">
            PD<span className="text-[#3b82f6]">.</span>
          </span>
          <nav className="hidden sm:flex gap-1">
            {navItems.map(n => (
              <span key={n.id} onClick={() => scrollTo(n.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-wide cursor-pointer transition-all ${
                  activeSection === n.id ? 'text-[#00e87b] bg-[#00e87b]/10' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {n.label}
              </span>
            ))}
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-[10%] left-[15%] w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(0,232,123,.08) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'float 6s ease-in-out infinite 1s' }} />

        <motion.div className="relative z-10 max-w-3xl"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}>
          <h1 className="font-display text-[clamp(28px,5vw,52px)] font-bold leading-[1.15] tracking-tight text-zinc-50 mb-2">
            Parth Dawar
          </h1>
          <div className="text-[clamp(16px,2.5vw,22px)] min-h-[60px] text-zinc-500 mb-6">
            {heroText}<span className="text-[#00e87b]" style={{ animation: 'pulse-glow 1s infinite' }}>|</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Incoming Summer Analyst Intern at <span className="text-[#3b82f6] font-semibold">Goldman Sachs</span>
            {' & '}
            Machine Learning Research Intern at <span className="text-[#00e87b] font-semibold">CNRS, France</span>
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => scrollTo('projects')} className="px-7 py-3 rounded-lg text-sm font-semibold bg-gradient-to-br from-[#00e87b] to-emerald-500 text-[#060608] flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00e87b]/30 transition-all cursor-pointer border-none font-mono">
              View Work <ArrowRight size={14} />
            </button>
            <button onClick={() => scrollTo('terminal')} className="px-7 py-3 rounded-lg text-sm font-semibold border border-white/10 text-zinc-200 flex items-center gap-2 hover:border-[#00e87b]/30 hover:bg-[#00e87b]/5 transition-all cursor-pointer bg-transparent font-mono">
              <Terminal size={14} /> Explore Stack
            </button>
          </div>
        </motion.div>

        <span onClick={() => scrollTo('terminal')} className="absolute bottom-10 text-zinc-700 cursor-pointer" style={{ animation: 'float 2s ease-in-out infinite' }}>
          <ChevronDown size={24} />
        </span>
      </section>

      {/* ─── TERMINAL ─── */}
      <Section id="terminal" className="max-w-3xl mx-auto px-6 py-24">
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-8">
          <Terminal size={18} className="text-[#00e87b]" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Tech Stack</h2>
          <span className="text-xs text-zinc-600">// interactive terminal</span>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-[11px] text-zinc-600">parth@portfolio — bash</span>
          </div>
          <div ref={termRef} className="p-4 h-72 overflow-y-auto text-sm leading-7">
            {terminalHistory.map((line, i) => (
              <div key={i} className={
                line.type === 'error' ? 'text-red-500' :
                line.type === 'success' ? 'text-[#00e87b]' :
                line.type === 'info' ? 'text-[#3b82f6]' :
                line.type === 'input' ? 'text-zinc-400 font-semibold' : 'text-zinc-500'
              }>{line.text}</div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
            <span className="text-[#00e87b] text-sm font-semibold">❯</span>
            <input value={terminalInput} onChange={e => setTerminalInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && terminalInput.trim()) { handleTerminal(terminalInput); setTerminalInput('') } }}
              placeholder="Type 'help' or a category..."
              className="flex-1 bg-transparent border-none outline-none text-zinc-200 text-sm font-mono placeholder:text-zinc-700" />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-5">
          {['skills', 'ml', 'web', 'data', 'tools'].map(cmd => (
            <button key={cmd} onClick={() => handleTerminal(cmd)}
              className="px-3.5 py-1.5 rounded-md text-[11px] font-medium border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-[#00e87b]/30 hover:text-[#00e87b] transition-all cursor-pointer font-mono">
              $ {cmd}
            </button>
          ))}
        </motion.div>
      </Section>

      {/* ─── GLOBE ─── */}
      <Section id="globe" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-8">
          <Globe2 size={18} className="text-[#3b82f6]" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Global Footprint</h2>
          <span className="text-xs text-zinc-600">// drag to rotate</span>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-wrap gap-10 items-center justify-center">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 inline-block" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)' }}>
            <GlobeCanvas size={380} />
          </div>
          <div className="flex-1 min-w-[260px] space-y-4">
            {/* Work locations */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 border-l-[3px] border-l-[#00e87b]">
              <div className="text-[11px] font-semibold tracking-[1.5px] text-[#00e87b] mb-3">WORK LOCATIONS</div>
              {[
                { flag: '🇮🇳', place: 'Hyderabad, India', role: 'IIT Hyderabad — B.Tech' },
                { flag: '🇫🇷', place: 'Saint-Étienne, France', role: 'CNRS — ML Research Intern' },
              ].map((w, i) => (
                <div key={i} className={`flex items-center gap-2.5 ${i === 0 ? 'mb-2.5' : ''}`}>
                  <span className="text-xl">{w.flag}</span>
                  <div>
                    <div className="font-semibold text-sm text-zinc-50">{w.place}</div>
                    <div className="text-xs text-zinc-500">{w.role}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Countries */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 border-l-[3px] border-l-[#3b82f6]">
              <div className="text-[11px] font-semibold tracking-[1.5px] text-[#3b82f6] mb-3">COUNTRIES VISITED</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { flag: '🇮🇳', name: 'India', color: '#00e87b' },
                  { flag: '🇫🇷', name: 'France', color: '#3b82f6' },
                  { flag: '🇮🇹', name: 'Italy', color: '#a78bfa' },
                  { flag: '🇲🇨', name: 'Monaco', color: '#ec4899' },
                  { flag: '🇪🇸', name: 'Spain', color: '#f59e0b' },
                  { flag: '🇨🇭', name: 'Switzerland', color: '#ef4444' },
                  { flag: '🇩🇪', name: 'Germany', color: '#06b6d4' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: c.color + '10', border: `1px solid ${c.color}25` }}>
                    <span className="text-sm">{c.flag}</span>
                    <span className="text-xs font-medium" style={{ color: c.color }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ─── TIMELINE ─── */}
      <Section id="timeline" className="max-w-2xl mx-auto px-6 py-20">
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-12">
          <Calendar size={18} className="text-purple-400" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Professional Timeline</h2>
        </motion.div>
        <div className="relative pl-9">
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5" style={{ background: 'linear-gradient(to bottom,#3b82f633,#00e87b33,#a78bfa33)' }} />
          {timeline.map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="mb-12 relative">
              <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full" style={{ background: item.color, boxShadow: `0 0 12px ${item.color}66` }} />
              {item.upcoming && (
                <div className="inline-block px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider mb-2"
                  style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>UPCOMING</div>
              )}
              <div className="text-xs font-semibold mb-1 tracking-wide" style={{ color: item.color }}>{item.date}</div>
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ color: item.color }}>{item.icon}</span>
                <h3 className="font-display text-lg font-semibold text-zinc-50">{item.title}</h3>
              </div>
              <div className="text-sm font-semibold text-zinc-500 mb-2">{item.org}</div>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ─── PROJECTS ─── */}
      <Section id="projects" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-10">
          <Code2 size={18} className="text-[#00e87b]" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Featured Projects</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {projects.map((proj, i) => (
            <motion.div key={i} variants={fadeUp}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 relative overflow-hidden cursor-pointer"
              style={{ borderTop: `2px solid ${proj.color}22` }}
              whileHover={{ y: -4, boxShadow: `0 12px 40px ${proj.color}15` }}>
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full" style={{ background: `radial-gradient(circle,${proj.color}12,transparent)` }} />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${proj.color}12`, color: proj.color }}>{proj.icon}</div>
                <h3 className="font-display text-base font-semibold text-zinc-50">{proj.title}</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">{proj.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {proj.tags.map((t, j) => (
                  <span key={j} className="px-2.5 py-1 rounded text-[11px] font-medium" style={{ background: `${proj.color}10`, color: proj.color, border: `1px solid ${proj.color}20` }}>{t}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ─── SUDOKU ─── */}
      <Section id="sudoku" className="max-w-xl mx-auto px-6 py-20">
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-2">
          <Gamepad2 size={18} className="text-amber-400" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Daily Logic Challenge</h2>
        </motion.div>
        <motion.p variants={fadeUp} className="text-sm text-zinc-500 mb-8">
          Fresh 4×4 Sudoku every day. Fill rows, columns, 2×2 boxes with 1–4. Timer starts when you select a cell.
        </motion.p>

        <motion.div variants={fadeUp} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              <span className={`text-lg font-bold tabular-nums ${sudoku.started ? 'text-zinc-50' : 'text-zinc-600'}`}>
                {sudoku.started ? formatTime(sudoku.elapsed) : '00:00'}
              </span>
              {!sudoku.started && <span className="text-[11px] text-zinc-600">waiting...</span>}
            </div>
            {sudoku.solved && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#00e87b]/10 text-[#00e87b] text-sm font-semibold">
                <Trophy size={14} /> Solved in {formatTime(sudoku.elapsed)}!
              </div>
            )}
            <button onClick={resetSudoku}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.08] bg-transparent text-zinc-400 text-xs cursor-pointer font-mono hover:border-white/20 transition-all">
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 max-w-[280px] mx-auto mb-5">
            {sudoku.current.flatMap((row, r) =>
              row.map((val, c) => {
                const isOrig = sudoku.puzzle[r][c] !== 0
                const isSel = sudoku.selected?.[0] === r && sudoku.selected?.[1] === c
                const isErr = sudoku.errors.has(`${r},${c}`)
                return (
                  <motion.div key={`${r}-${c}`} onClick={() => handleSudokuCell(r, c)}
                    whileTap={{ scale: 0.95 }}
                    className={`aspect-square flex items-center justify-center text-xl rounded-md cursor-pointer transition-all
                      ${isSel ? 'bg-[#00e87b]/[0.12] border-2 border-[#00e87b]' :
                        isErr ? 'bg-red-500/[0.08] border-2 border-red-500/30' :
                        'bg-white/[0.03] border-2 border-white/[0.06]'}
                      ${isOrig ? 'font-bold text-zinc-50' : isErr ? 'text-red-500' : 'text-[#00e87b] font-medium'}
                    `}
                    style={{
                      borderRight: c === 1 ? '2px solid rgba(255,255,255,0.12)' : undefined,
                      borderBottom: r === 1 ? '2px solid rgba(255,255,255,0.12)' : undefined,
                    }}>
                    {val || ''}
                  </motion.div>
                )
              })
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {[1,2,3,4,0].map(n => (
              <motion.button key={n} onClick={() => handleSudokuInput(n)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-lg font-semibold font-mono cursor-pointer flex items-center justify-center transition-all border border-white/[0.08] ${
                  n === 0 ? 'bg-red-500/[0.08] text-red-500 hover:bg-red-500/[0.15]' : 'bg-white/[0.04] text-zinc-200 hover:bg-[#00e87b]/10'
                }`}>
                {n === 0 ? <X size={16} /> : n}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 px-6 border-t border-white/[0.04] text-center">
        <div className="flex justify-center gap-5 mb-5">
          {[
            { icon: <Github size={18} />, href: 'https://github.com/parthdawar' },
            { icon: <Linkedin size={18} />, href: 'https://linkedin.com/in/parthdawar' },
            { icon: <Mail size={18} />, href: 'mailto:parth@example.com' },
          ].map((link, i) => (
            <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/[0.06] text-zinc-500 hover:text-[#00e87b] hover:border-[#00e87b]/30 transition-all no-underline">
              {link.icon}
            </a>
          ))}
        </div>
        <p className="text-xs text-zinc-700">© 2026 Parth Dawar. Built with React + Vite + Tailwind + Framer Motion.</p>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse-glow { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  )
}
