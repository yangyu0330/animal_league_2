'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { calculateCurrentStudentCount } from '@/lib/domain'
import type { DepartmentCategory, PressureLevel } from '@/lib/types'

type MascotEffects = {
  fxTick: number
  comboCount: number
  comboActive: boolean
  studentDropTick: number
  stageUpTick: number
  speechTick: number
}

interface MascotCardProps {
  category: DepartmentCategory
  pressureLevel: PressureLevel
  totalClicks: number
  todayClicks: number
  effects?: MascotEffects
}

const professorBackgroundSprite = '/characters/professor-bg-classroom.png'
const professorStageSprites: Record<PressureLevel, string> = {
  0: '/characters/professor-stage-01.png',
  1: '/characters/professor-stage-02.png',
  2: '/characters/professor-stage-03.png',
  3: '/characters/professor-stage-04.png',
  4: '/characters/professor-stage-05.png',
  5: '/characters/professor-stage-06.png',
  6: '/characters/professor-stage-07.png',
}

const studentSprites = [
  '/characters/student-01.png',
  '/characters/student-02.png',
  '/characters/student-03.png',
  '/characters/student-04.png',
  '/characters/student-05.png',
  '/characters/student-06.png',
  '/characters/student-07.png',
  '/characters/student-08.png',
  '/characters/student-09.png',
  '/characters/student-10.png',
]

const pressureBackgrounds: Record<PressureLevel, string> = {
  0: 'from-pressure-0/50 to-pressure-0/20',
  1: 'from-pressure-1/55 to-pressure-1/25',
  2: 'from-pressure-2/55 to-pressure-2/25',
  3: 'from-pressure-3/60 to-pressure-3/30',
  4: 'from-pressure-4/65 to-pressure-4/35',
  5: 'from-pressure-5/70 to-pressure-5/40',
  6: 'from-pressure-6/80 to-pressure-6/50',
}

const pressureFaces: Record<PressureLevel, string> = {
  0: '^_^',
  1: 'o_o',
  2: '-_-',
  3: ';_;',
  4: '>_<',
  5: 'x_x',
  6: 'T_T',
}

type PhysicsRefs = {
  engine: Matter.Engine
  render: Matter.Render
  runner: Matter.Runner
  studentBodies: Matter.Body[]
  resetTimeoutId: number | null
}

const stageSize = 270
const studentBodySize = 42
const pileResetDelayMs = 900
const speechDurationMs = 1600
const studentDropDurationMs = 680
const stageUpDurationMs = 820
const comboFadeDurationMs = 260

const defaultEffects: MascotEffects = {
  fxTick: 0,
  comboCount: 0,
  comboActive: false,
  studentDropTick: 0,
  stageUpTick: 0,
  speechTick: 0,
}

const baseSpeechLines = ['더 눌러!', '압박 간다!', '멈추지 마!']
const highComboSpeechLines = ['속도 미쳤다!', '이건 너무 세다!', '이거 실화냐!']
const studentDropSpeechLines = ['학생 추가!', '난입 시작!', '한 명 더 왔다!']
const stageUpSpeechLines = ['단계 상승!', '분위기 바뀐다!', '이제 진짜 시작!']

function getProfessorSpriteByLevel(pressureLevel: PressureLevel): string {
  return professorStageSprites[pressureLevel]
}

function buildStudentBody(index: number): Matter.Body {
  const sprite = studentSprites[index % studentSprites.length]
  const spawnX = stageSize * 0.5 + (-22 + Math.random() * 44)
  const spawnY = studentBodySize * 0.5 + 6
  const body = Matter.Bodies.rectangle(spawnX, spawnY, studentBodySize, studentBodySize, {
    restitution: 0.98,
    friction: 0.04,
    frictionStatic: 0.001,
    frictionAir: 0.0013,
    density: 0.0028,
    render: {
      sprite: {
        texture: sprite,
        xScale: studentBodySize / 768,
        yScale: studentBodySize / 768,
      },
    },
  })

  Matter.Body.setVelocity(body, {
    x: -16 + Math.random() * 32,
    y: 16 + Math.random() * 9,
  })
  Matter.Body.setAngularVelocity(body, -1.1 + Math.random() * 2.2)
  Matter.Body.applyForce(body, body.position, {
    x: -0.014 + Math.random() * 0.028,
    y: 0.01 + Math.random() * 0.014,
  })

  return body
}

function createStaticBodies() {
  const wallThickness = 32
  const topWall = Matter.Bodies.rectangle(stageSize * 0.5, -10, stageSize + wallThickness, 30, {
    isStatic: true,
    restitution: 0.9,
    friction: 0.08,
    render: { fillStyle: 'transparent' },
  })
  const floor = Matter.Bodies.rectangle(stageSize * 0.5, stageSize + 10, stageSize + wallThickness, 30, {
    isStatic: true,
    restitution: 0.82,
    friction: 0.12,
    render: { fillStyle: 'transparent' },
  })
  const leftWall = Matter.Bodies.rectangle(-10, stageSize * 0.5, wallThickness, stageSize, {
    isStatic: true,
    restitution: 0.9,
    friction: 0.08,
    render: { fillStyle: 'transparent' },
  })
  const rightWall = Matter.Bodies.rectangle(stageSize + 10, stageSize * 0.5, wallThickness, stageSize, {
    isStatic: true,
    restitution: 0.9,
    friction: 0.08,
    render: { fillStyle: 'transparent' },
  })

  return [topWall, floor, leftWall, rightWall]
}

function clearStudentBodies(refs: PhysicsRefs) {
  if (refs.studentBodies.length === 0) return
  Matter.Composite.remove(refs.engine.world, refs.studentBodies)
  refs.studentBodies = []
}

function pickSpeechLine(lines: string[], seed: number) {
  return lines[Math.abs(seed) % lines.length]
}

function getComboSubLabel(comboCount: number) {
  if (comboCount >= 20) return 'OVERHEAT!'
  if (comboCount >= 10) return 'CRITICAL!'
  if (comboCount >= 5) return 'NICE COMBO!'
  return 'HIT!'
}

export function MascotCard({ category, pressureLevel, totalClicks, todayClicks, effects }: MascotCardProps) {
  const safeClicks = Math.max(totalClicks, 0)
  const activeEffects = effects ?? defaultEffects
  const professorSprite = getProfessorSpriteByLevel(pressureLevel)
  const remainderClicks = safeClicks % 1000
  const isCycleComplete = safeClicks > 0 && remainderClicks === 0
  const cycle = isCycleComplete ? Math.floor((safeClicks - 1) / 1000) : Math.floor(safeClicks / 1000)
  const studentCount = calculateCurrentStudentCount(safeClicks)
  const physicsRootRef = useRef<HTMLDivElement | null>(null)
  const physicsRefsRef = useRef<PhysicsRefs | null>(null)
  const previousStateRef = useRef<{ cycle: number; studentCount: number }>({ cycle, studentCount: 0 })
  const previousEffectsRef = useRef<MascotEffects>(activeEffects)
  const speechTimeoutRef = useRef<number | null>(null)
  const studentDropTimeoutRef = useRef<number | null>(null)
  const stageUpTimeoutRef = useRef<number | null>(null)
  const comboFadeTimeoutRef = useRef<number | null>(null)
  const [speechText, setSpeechText] = useState<string | null>(null)
  const [speechKey, setSpeechKey] = useState(0)
  const [studentDropActive, setStudentDropActive] = useState(false)
  const [studentDropKey, setStudentDropKey] = useState(0)
  const [stageUpActive, setStageUpActive] = useState(false)
  const [stageUpKey, setStageUpKey] = useState(0)
  const [stageFlashActive, setStageFlashActive] = useState(false)
  const [comboVisible, setComboVisible] = useState(false)
  const [comboFading, setComboFading] = useState(false)
  const [comboValuePulseKey, setComboValuePulseKey] = useState(0)
  const comboSubLabel = getComboSubLabel(activeEffects.comboCount)
  const comboIntensityClass = activeEffects.comboCount >= 10 ? 'combo-jitter-strong' : ''
  const shakeClass = activeEffects.comboActive
    ? activeEffects.comboCount >= 10
      ? 'impact-shake-loop-strong'
      : activeEffects.comboCount >= 2
        ? 'impact-shake-loop'
        : 'impact-shake'
    : ''

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current)
      if (studentDropTimeoutRef.current !== null) window.clearTimeout(studentDropTimeoutRef.current)
      if (stageUpTimeoutRef.current !== null) window.clearTimeout(stageUpTimeoutRef.current)
      if (comboFadeTimeoutRef.current !== null) window.clearTimeout(comboFadeTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const isComboRunning = activeEffects.comboActive && activeEffects.comboCount > 0
    if (isComboRunning) {
      if (comboFadeTimeoutRef.current !== null) {
        window.clearTimeout(comboFadeTimeoutRef.current)
        comboFadeTimeoutRef.current = null
      }
      if (!comboVisible) {
        setComboVisible(true)
      }
      if (comboFading) {
        setComboFading(false)
      }
      setComboValuePulseKey((value) => value + 1)
      return
    }

    if (!comboVisible || comboFading) return
    setComboFading(true)
    comboFadeTimeoutRef.current = window.setTimeout(() => {
      setComboVisible(false)
      setComboFading(false)
      comboFadeTimeoutRef.current = null
    }, comboFadeDurationMs)
  }, [activeEffects.comboActive, activeEffects.comboCount, comboFading, comboVisible])

  useEffect(() => {
    const root = physicsRootRef.current
    if (!root) return

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0.9 } })
    const render = Matter.Render.create({
      element: root,
      engine,
      options: {
        width: stageSize,
        height: stageSize,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    })
    const runner = Matter.Runner.create()
    Matter.Composite.add(engine.world, createStaticBodies())

    Matter.Render.run(render)
    Matter.Runner.run(runner, engine)

    physicsRefsRef.current = { engine, render, runner, studentBodies: [], resetTimeoutId: null }

    return () => {
      const refs = physicsRefsRef.current
      if (!refs) return
      if (refs.resetTimeoutId !== null) {
        window.clearTimeout(refs.resetTimeoutId)
      }
      Matter.Render.stop(refs.render)
      Matter.Runner.stop(refs.runner)
      Matter.Composite.clear(refs.engine.world, false)
      Matter.Engine.clear(refs.engine)
      refs.render.canvas.remove()
      refs.render.textures = {}
      physicsRefsRef.current = null
    }
  }, [])

  useEffect(() => {
    const refs = physicsRefsRef.current
    if (!refs) return

    const { engine, studentBodies } = refs
    const prev = previousStateRef.current

    if (studentCount < prev.studentCount || cycle !== prev.cycle) {
      clearStudentBodies(refs)
    }

    if (refs.resetTimeoutId !== null) {
      window.clearTimeout(refs.resetTimeoutId)
      refs.resetTimeoutId = null
    }

    if (studentCount > refs.studentBodies.length) {
      for (let index = refs.studentBodies.length; index < studentCount; index += 1) {
        const studentBody = buildStudentBody(index)
        Matter.Composite.add(engine.world, studentBody)
        refs.studentBodies.push(studentBody)
      }
    } else if (studentCount < refs.studentBodies.length) {
      const removed = refs.studentBodies.splice(studentCount)
      Matter.Composite.remove(engine.world, removed)
    }

    if (isCycleComplete && refs.studentBodies.length === 10) {
      refs.resetTimeoutId = window.setTimeout(() => {
        clearStudentBodies(refs)
        refs.resetTimeoutId = null
      }, pileResetDelayMs)
    }

    previousStateRef.current = { cycle, studentCount }
  }, [cycle, isCycleComplete, studentCount])

  useEffect(() => {
    const prev = previousEffectsRef.current
    const next = activeEffects
    const stageUpChanged = next.stageUpTick !== prev.stageUpTick
    const studentDropChanged = next.studentDropTick !== prev.studentDropTick
    const speechChanged = next.speechTick !== prev.speechTick

    if (stageUpChanged) {
      setStageUpActive(true)
      setStageFlashActive(true)
      setStageUpKey((value) => value + 1)
      if (stageUpTimeoutRef.current !== null) window.clearTimeout(stageUpTimeoutRef.current)
      stageUpTimeoutRef.current = window.setTimeout(() => {
        setStageUpActive(false)
        setStageFlashActive(false)
        stageUpTimeoutRef.current = null
      }, stageUpDurationMs)

      const stageSpeech = pickSpeechLine(stageUpSpeechLines, next.stageUpTick)
      setSpeechText(stageSpeech)
      setSpeechKey((value) => value + 1)
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = window.setTimeout(() => {
        setSpeechText(null)
        speechTimeoutRef.current = null
      }, speechDurationMs)
    } else if (studentDropChanged) {
      setStudentDropActive(true)
      setStudentDropKey((value) => value + 1)
      if (studentDropTimeoutRef.current !== null) window.clearTimeout(studentDropTimeoutRef.current)
      studentDropTimeoutRef.current = window.setTimeout(() => {
        setStudentDropActive(false)
        studentDropTimeoutRef.current = null
      }, studentDropDurationMs)

      const dropSpeech = pickSpeechLine(studentDropSpeechLines, next.studentDropTick)
      setSpeechText(dropSpeech)
      setSpeechKey((value) => value + 1)
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = window.setTimeout(() => {
        setSpeechText(null)
        speechTimeoutRef.current = null
      }, speechDurationMs)
    } else if (speechChanged) {
      const lines = next.comboCount >= 10 ? highComboSpeechLines : baseSpeechLines
      const text = pickSpeechLine(lines, next.speechTick)
      setSpeechText(text)
      setSpeechKey((value) => value + 1)
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = window.setTimeout(() => {
        setSpeechText(null)
        speechTimeoutRef.current = null
      }, speechDurationMs)
    }

    previousEffectsRef.current = next
  }, [activeEffects])

  return (
    <section
      className={`relative min-h-[320px] rounded-2xl border border-border bg-gradient-to-b ${pressureBackgrounds[pressureLevel]} p-4`}
    >
      <div className="absolute right-4 top-4 rounded-full bg-card/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
        {pressureLevel}단계
      </div>

      <div className="flex h-full flex-col">
        <div className="pr-16">
          <p className="text-xs font-medium text-muted-foreground">계열 템플릿</p>
          <p className="text-sm font-semibold text-foreground">{category}</p>
        </div>

        <div className="relative mx-auto mt-3 aspect-square w-full max-w-[270px]">
          <div className={`relative h-full w-full overflow-hidden rounded-lg bg-[#d8cab9] ${shakeClass}`}>
            <Image
              src={professorBackgroundSprite}
              alt="교수님 배경"
              fill
              sizes="270px"
              className="absolute inset-0 z-0 object-cover object-left"
              style={{ imageRendering: 'pixelated' }}
              priority
            />
            <Image
              src={professorSprite}
              alt="교수님"
              width={768}
              height={768}
              className="absolute left-1/2 top-4 z-10 h-[200px] w-[200px] -translate-x-1/2 object-contain"
              style={{ imageRendering: 'pixelated' }}
              priority
            />
            <div className="absolute inset-0 z-20">
              <div ref={physicsRootRef} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              {comboVisible && activeEffects.comboCount > 0 ? (
                <div className={`absolute left-2 top-2 z-40 ${comboIntensityClass} combo-jitter`}>
                  <div
                    className={`combo-pop rounded-[6px] border border-black/70 bg-[#ffe08a]/90 px-2 py-1 text-[10px] font-black text-[#5d1304] ${
                      comboFading ? 'combo-fade-out' : ''
                    }`}
                  >
                    <p className="pixel-outline leading-none">
                      <span key={`combo-value-${comboValuePulseKey}`} className="combo-value-pop inline-block">
                        COMBO x{activeEffects.comboCount}
                      </span>
                    </p>
                    <p className="pixel-outline mt-0.5 leading-none text-[9px] text-[#b53008]">{comboSubLabel}</p>
                  </div>
                </div>
              ) : null}

              {studentDropActive ? (
                <>
                  <div key={`speed-${studentDropKey}`} className="speedline-sweep absolute inset-0 z-30" />
                  <div
                    key={`drop-${studentDropKey}`}
                    className="event-banner absolute left-1/2 top-6 z-40 -translate-x-1/2 rounded-[6px] border border-black/70 bg-[#ffbf58]/90 px-2 py-1 text-[10px] font-black text-[#5a1200]"
                  >
                    <p className="pixel-outline leading-none">STUDENT DROP!</p>
                  </div>
                </>
              ) : null}

              {stageUpActive ? (
                <div
                  key={`stage-${stageUpKey}`}
                  className="event-banner absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-black/80 bg-[#ff7b2e]/95 px-3 py-1.5 text-xs font-black text-[#fff4d6]"
                >
                  <p className="pixel-outline leading-none">STAGE UP!</p>
                </div>
              ) : null}

              {stageFlashActive ? <div key={`flash-${stageUpKey}`} className="stage-flash absolute inset-0 z-[35]" /> : null}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
            {speechText ? (
              <div
                key={`speech-${speechKey}`}
                className="speech-pop speech-bubble absolute left-1/2 top-2 z-40 w-max max-w-[240px] -translate-x-1/2 rounded-[8px] border border-black/75 bg-[#fff6df] px-3.5 py-2.5 text-center text-[15px] font-semibold text-[#2c120a]"
              >
                <p className="speech-outline leading-[1.25]">{speechText}</p>
                <div className="speech-tail absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#fff6df]" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">총 클릭</p>
            <p className="number-display text-lg font-bold text-foreground">{safeClicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">현재 학생</p>
            <p className="number-display text-lg font-bold text-foreground">{studentCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">오늘 클릭</p>
            <p className="number-display text-lg font-bold text-foreground">{todayClicks.toLocaleString()}</p>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {pressureFaces[pressureLevel]} · 100 클릭당 학생 1명 · 1000 클릭마다 초기화
        </p>
      </div>
    </section>
  )
}
