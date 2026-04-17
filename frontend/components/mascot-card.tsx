'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import type { DepartmentCategory, PressureLevel } from '@/lib/types'

interface MascotCardProps {
  category: DepartmentCategory
  pressureLevel: PressureLevel
  totalClicks: number
  stackCount: number
}

const categoryIcons: Partial<Record<DepartmentCategory, string>> = {
  공학: '기어',
  자연과학: '실험',
  인문: '서가',
  사회과학: '네트워크',
  '경영/경제': '보드',
  '예술/체육': '무대',
  교육: '클래스',
  '보건/의학': '모니터',
}

function getCategoryIcon(category: DepartmentCategory): string {
  return categoryIcons[category] ?? 'stack'
}

const professorSprite = '/characters/professor-base.png'
const professorBackgroundSprite = '/characters/professor-bg-classroom.png'

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
}

const pressureFaces: Record<PressureLevel, string> = {
  0: '^_^',
  1: '-_-',
  2: 'T_T',
  3: ';_;',
  4: 'x_x',
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

function buildStudentBody(index: number): Matter.Body {
  const sprite = studentSprites[index % studentSprites.length]
  const spawnX = 48 + Math.random() * (stageSize - 96)
  const body = Matter.Bodies.rectangle(spawnX, -studentBodySize, studentBodySize, studentBodySize, {
    restitution: 0.9,
    friction: 0.16,
    frictionStatic: 0.001,
    frictionAir: 0.004,
    density: 0.0016,
    render: {
      sprite: {
        texture: sprite,
        xScale: studentBodySize / 768,
        yScale: studentBodySize / 768,
      },
    },
  })

  Matter.Body.setVelocity(body, {
    x: -5 + Math.random() * 10,
    y: 7 + Math.random() * 5,
  })
  Matter.Body.setAngularVelocity(body, -0.28 + Math.random() * 0.56)

  return body
}

function createStaticBodies() {
  const wallThickness = 32
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

  return [floor, leftWall, rightWall]
}

function clearStudentBodies(refs: PhysicsRefs) {
  if (refs.studentBodies.length === 0) return
  Matter.Composite.remove(refs.engine.world, refs.studentBodies)
  refs.studentBodies = []
}

export function MascotCard({ category, pressureLevel, totalClicks, stackCount }: MascotCardProps) {
  const safeClicks = Math.max(totalClicks, 0)
  const remainderClicks = safeClicks % 1000
  const isCycleComplete = safeClicks > 0 && remainderClicks === 0
  const cycle = isCycleComplete ? Math.floor((safeClicks - 1) / 1000) : Math.floor(safeClicks / 1000)
  const studentCount = isCycleComplete ? 10 : Math.floor(remainderClicks / 100)
  const physicsRootRef = useRef<HTMLDivElement | null>(null)
  const physicsRefsRef = useRef<PhysicsRefs | null>(null)
  const previousStateRef = useRef<{ cycle: number; studentCount: number }>({ cycle, studentCount: 0 })

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

  return (
    <section
      className={`relative min-h-[320px] rounded-2xl border border-border bg-gradient-to-b ${pressureBackgrounds[pressureLevel]} p-4`}
    >
      <div className="absolute right-4 top-4 rounded-full bg-card/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
        {getCategoryIcon(category)}
      </div>

      <div className="flex h-full flex-col">
        <div className="pr-16">
          <p className="text-xs font-medium text-muted-foreground">계열 템플릿</p>
          <p className="text-sm font-semibold text-foreground">{category}</p>
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-black p-2">
          <div className="relative mx-auto aspect-square w-full max-w-[270px] overflow-hidden rounded-md bg-black">
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
            <p className="text-[11px] text-muted-foreground">누적 단계</p>
            <p className="number-display text-lg font-bold text-foreground">{stackCount}</p>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {pressureFaces[pressureLevel]} · 100 클릭당 학생 1명 · 1000 클릭마다 초기화
        </p>
      </div>
    </section>
  )
}
