# 🎯 Motion & MotionTimeline

A minimal, powerful and composable animation system based on `offset-path`. Define animations step-by-step, chain them in time, and run clean declarative animation scenes.

---

## ✨ Features

- Chainable motion builder with `Promise`-based execution
- Declarative steps with optional styles and precise timing
- Supports offset-path animation with auto-generated keyframes
- Fully DOM-aware — each step receives live `node` and `rect`
- Compose complex scenes using `MotionTimeline`

---

## 📦 Usage

### Motion

```ts
const motion = new Motion(node)

await motion
  .addStep(({ rect }) => ({
    point: [rect.left, rect.top],
  }))
  .addStep(({ rect }) => ({
    at: 100,
    point: [rect.left + 100, rect.top],
    styles: { opacity: "0.5", scale: "0.8" },
  }))
  .duration(800)
  .easing("ease-in-out")
  .delay(100)
  .repeat(1)
  .direction("normal")
  .before(({ node }) => {
    console.log("before animation", node)
  })
  .after(() => {
    console.log("done")
  })
  .run()
```

---

## 🔧 Motion API

| Method | Description |
|--------|-------------|
| `.addStep(fn)` | Adds a step to the animation. The function receives `{ node, rect }` |
| `.duration(ms)` | Sets total animation duration in milliseconds |
| `.easing(name)` | CSS easing (e.g. `"linear"`, `"ease"`, `"ease-in"`, `cubic-bezier(...)`) |
| `.delay(ms)` | Sets delay before the animation |
| `.repeat(n \| "infinite")` | Sets repeat count |
| `.direction("normal" \| "reverse")` | Direction of animation |
| `.before(cb)` | Hook executed before animation starts. Can be `async` |
| `.after(cb)` | Hook executed after animation ends. Can be `async` |
| `.run()` | Runs the animation and returns `Promise<void>` |

---

## 📘 Types

```ts
type Point = [x: number, y: number]

interface GenerateStepArgs {
  node: HTMLElement | SVGElement
  rect: DOMRect
}

interface Step {
  at?: number // 0–100 timeline percentage
  point: Point
  styles?: Partial<CSSStyleDeclaration>
}

type StepFactory = (args: GenerateStepArgs) => Step
```

---

## 🎬 MotionTimeline

`MotionTimeline` chains multiple `Motion` or `MotionTimeline` instances and plays them sequentially.

```ts
const timeline = new MotionTimeline()

await timeline
  .add(new Motion(node1).addStep(...).duration(500))
  .add(new Motion(node2).addStep(...).duration(300))
  .play()
```

### Nested timelines

```ts
const intro = new MotionTimeline()
  .add(new Motion(ui1).addStep(...).duration(200))
  .add(new Motion(ui2).addStep(...).duration(200))

await new MotionTimeline()
  .add(intro)
  .add(new Motion(mainEl).addStep(...).duration(1000))
  .play()
```

---

## 🔧 Timeline API

| Method | Description |
|--------|-------------|
| `.add(motion)` | Adds a `Motion` or another `MotionTimeline` to the queue |
| `.clear()` | Clears the queue |
| `.play()` | Runs all motions in order, returns `Promise<void>` |

---

## 🧪 Example: coin and label animation

```ts
await new MotionTimeline()
  .add(
    new Motion(coin)
      .addStep(({ rect }) => ({
        point: [rect.left + rect.width / 2, rect.top],
      }))
      .addStep(() => ({
        point: [window.innerWidth - 40, 40],
        styles: { opacity: "0" },
      }))
      .duration(1000)
  )
  .add(
    new Motion(label)
      .addStep(({ rect }) => ({
        point: [rect.left, rect.top],
        styles: { opacity: "1" },
      }))
      .duration(600)
  )
  .play()
```

---

## 🔍 When to use

- Game effects (coins, items, characters)
- UI animations and transitions
- Declarative scene scripting
- Precise DOM-based motion effects

---

Let the motion begin 💫
