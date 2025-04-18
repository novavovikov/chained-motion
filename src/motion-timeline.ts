import type { Motion } from "./motion"

export class MotionTimeline {
  private queue: Array<Motion | MotionTimeline> = []

  add(entry: Motion | MotionTimeline) {
    this.queue.push(entry)
    return this
  }

  clear() {
    this.queue = []
    return this
  }

  async play(): Promise<void> {
    for (const entry of this.queue) {
      if (entry instanceof MotionTimeline) {
        await entry.play()
      } else {
        await entry.run()
      }
    }
  }
}
