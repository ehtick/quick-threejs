import { Subscription } from "rxjs";
import { PerspectiveCamera } from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { type Module } from "@/common";
import { TimerController } from "../timer/timer.controller";
import { WorldController } from "../world/world.controller";
import { DebugService } from "./debug.service";
import { DebugController } from "./debug.controller";

@scoped(Lifecycle.ContainerScoped)
export class DebugModule implements Module {
	private _subscriptions: Subscription[] = [];

	constructor(
		@inject(DebugService) public readonly _service: DebugService,
		@inject(DebugController) public readonly _controller: DebugController,
		@inject(TimerController) private readonly _timerController: TimerController,
		@inject(WorldController) private readonly _worldController: WorldController
	) {}

	public init() {
		this._service.init();

		this._subscriptions.push(
			this._timerController.beforeStep$.subscribe(() =>
				this._service.beginInspectorFrame()
			),
			this._worldController.afterRender$.subscribe(() =>
				this._service.finishInspectorFrame()
			),
			this._controller.step$.subscribe(this._service.update.bind(this._service))
		);
	}

	public enabled(value?: boolean) {
		if (value) this._service.enabled = value;
		return this._service.enabled;
	}

	public miniCamera(value?: PerspectiveCamera) {
		if (value) this._service.miniCamera = value;
		return this._service.miniCamera;
	}

	public inspector() {
		return this._service.inspector;
	}

	public getAxesHelper() {
		return this._service.axesHelper;
	}

	public getCameraControls() {
		return this._service.cameraControls;
	}

	public getGridHelper() {
		return this._service.gridHelper;
	}

	public getMiniCameraControls() {
		return this._service.miniCameraControls;
	}

	public getStep$() {
		return this._controller.step$;
	}

	public dispose() {
		this._service.dispose();
		this._subscriptions.forEach((sub) => sub.unsubscribe());
		this._subscriptions = [];
	}
}
