type Point = [x: number, y: number]

type Node = HTMLElement | SVGElement

export interface GenerateStepArgs {
  node: Node
  rect: DOMRect
}

export interface Step {
  at?: number
  point: Point
  styles?: Partial<CSSStyleDeclaration>
}

export type StepFactory = (args: GenerateStepArgs) => Step

export type Repeat = number | "infinite"

export type Direction = "normal" | "reverse"

export interface MotionCloneAnimation {
  name: string
  duration: number
  easing: string
  delay: number
  repeat: Repeat
  direction: Direction
}

export class Motion {
  private node: Node
  private factories: StepFactory[] = []

  private durationMs = 1000
  private easingFn = "linear"
  private delayMs = 0
  private repeatCount: Repeat = 1
  private directionVal: Direction = "normal"
  private beforeCallback?: (ctx: GenerateStepArgs) => void | Promise<void>
  private afterCallback?: (ctx: GenerateStepArgs) => void | Promise<void>

  constructor(node: Node) {
    this.node = node
  }

  addStep(factory: StepFactory) {
    this.factories.push(factory)
    return this
  }

  duration(ms: number) {
    this.durationMs = ms
    return this
  }

  easing(easing: string) {
    this.easingFn = easing
    return this
  }

  delay(ms: number) {
    this.delayMs = ms
    return this
  }

  repeat(n: Repeat) {
    this.repeatCount = n
    return this
  }

  direction(value: Direction) {
    this.directionVal = value
    return this
  }

  before(cb: (ctx: GenerateStepArgs) => void | Promise<void>) {
    this.beforeCallback = cb
    return this
  }

  after(cb: (ctx: GenerateStepArgs) => void | Promise<void>) {
    this.afterCallback = cb
    return this
  }

  async run(): Promise<void> {
    const rect = this.node.getBoundingClientRect()
    const context: GenerateStepArgs = { node: this.node, rect }

    if (this.beforeCallback) {
      await this.beforeCallback(context)
    }

    const steps = this.factories.map((fn) => fn(context))
    if (steps.length === 0) return

    const [startX, startY] = steps[0].point
    const normalized = steps.map(({ point }) => [point[0] - startX, point[1] - startY] as Point)

    const pathString = this.buildPath(normalized)
    const keyframeName = `motion_${Math.random().toString(36).slice(2)}`
    const keyframeCSS = this.buildKeyframes(keyframeName, steps)
    const styleEl = this.injectStyle(keyframeCSS)

    const clone = this.createClone(this.node, rect, startX, startY, pathString, {
      name: keyframeName,
      duration: this.durationMs,
      easing: this.easingFn,
      delay: this.delayMs,
      repeat: this.repeatCount,
      direction: this.directionVal,
    })

    document.body.appendChild(clone)

    if (this.repeatCount !== "infinite") {
      const total =
        (this.durationMs + this.delayMs) *
        (typeof this.repeatCount === "number" ? this.repeatCount : 1)

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          clone.remove()
          styleEl.remove()
          resolve()
        }, total)
      })
    }

    if (this.afterCallback) {
      await this.afterCallback(context)
    }
  }

  private buildPath(points: Point[]): string {
    if (points.length === 1) {
      const [x, y] = points[0]
      return `path("M 0 0 L ${x} ${y}")`
    }

    const path = ["M 0 0"]
    for (let i = 0; i < points.length; i += 2) {
      const [x1, y1] = points[i] ?? points.at(-1)!
      const [x2, y2] = points[i + 1] ?? points.at(-1)!
      const [x3, y3] = points[i + 2] ?? points.at(-1)!
      path.push(`C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`)
    }

    return `path("${path.join(" ")}")`
  }

  private buildKeyframes(name: string, steps: Step[]): string {
    const frames = steps.map((step, i) => {
      const percent = step.at ?? (i / (steps.length - 1)) * 100
      const styleBlock = step.styles
        ? Object.entries(step.styles)
            .map(([k, v]) => `${k}: ${v};`)
            .join(" ")
        : ""

      return `${percent}% { offset-distance: ${percent}%; ${styleBlock} }`
    })

    return `@keyframes ${name} {\n${frames.join("\n")}\n}`
  }

  private injectStyle(css: string): HTMLStyleElement {
    const el = document.createElement("style")
    el.innerHTML = css
    document.head.appendChild(el)
    return el
  }

  private createClone(
    node: Node,
    rect: DOMRect,
    x: number,
    y: number,
    path: string,
    animation: MotionCloneAnimation
  ): Node {
    const clone = node.cloneNode(true) as Node
    const style = clone.style

    Object.assign(style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: "9999",
      pointerEvents: "none",
      transform: "translate(0, 0)",
      offsetPath: path,
      offsetDistance: "0%",
      offsetRotate: "0deg",
      willChange: "offset-distance",
      animation: `${animation.name} ${animation.duration}ms ${animation.easing} ${animation.delay}ms ${animation.repeat} ${animation.direction} forwards`,
    })

    return clone
  }
}
