import type { ProxyReceiver } from "@quick-threejs/utils";
import { Timer } from "three";
import { Lifecycle, scoped } from "tsyringe";

import type { TimerFramePayload } from "@/common/interfaces/timer.interface";

@scoped(Lifecycle.ContainerScoped)
export class TimerService {
	public readonly fps = 60;
	public readonly frame = 1000 / this.fps;
	public readonly timer = new Timer();
	public readonly initialTime = Date.now();
	public readonly framePayload: TimerFramePayload;

	public elapsed = 0;
	public previousDelta = 0;
	public delta = 0;
	public deltaRatio = 0;
	public enabled = false;

	constructor() {
		this.framePayload = {
			fps: this.fps,
			frame: this.frame,
			initialTime: this.initialTime,
			elapsed: this.elapsed,
			previousDelta: this.previousDelta,
			delta: this.delta,
			deltaRatio: this.deltaRatio,
			enabled: this.enabled
		};
	}

	init(proxy: ProxyReceiver<Record<string, unknown>>) {
		this.timer.connect(proxy as unknown as Document);
	}

	public step() {
		this.timer.update();

		this.elapsed = this.timer.getElapsed();
		this.delta = this.elapsed - this.previousDelta;
		this.previousDelta = this.elapsed;
		this.deltaRatio = this.delta / this.frame;

		this.framePayload.elapsed = this.elapsed;
		this.framePayload.previousDelta = this.previousDelta;
		this.framePayload.delta = this.delta;
		this.framePayload.deltaRatio = this.deltaRatio;
		this.framePayload.enabled = this.enabled;
	}

	public syncEnabled() {
		this.framePayload.enabled = this.enabled;
	}

	public dispose() {
		this.timer.disconnect();
	}
}
