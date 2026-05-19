import { Subscription } from "rxjs";
import { PerspectiveCamera } from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { type Module, type AppProps, APP_PROPS_TOKEN } from "@/common";
import { DebugService } from "./debug.service";
import { DebugController } from "./debug.controller";

@scoped(Lifecycle.ContainerScoped)
export class DebugModule implements Module {
	private _subscriptions: Subscription[] = [];

	constructor(
		@inject(DebugService) public readonly _service: DebugService,
		@inject(DebugController) public readonly _controller: DebugController,
		@inject(APP_PROPS_TOKEN) private readonly _props: AppProps
	) {}

	public init() {
		const { debug } = this._props.event || {};

		this._service.enabled = !!debug?.enabled;
		if (!this._service.enabled) return;
		if (debug?.withMiniCamera) this._service.initMiniCamera();
		if (debug?.enableControls) {
			this._service.initOrbitControl();
			this._service.initMiniCameraOrbitControls();
		}
		if (typeof debug?.axesSizes === "number")
			this._service.initAxesHelper(debug.axesSizes);
		if (typeof debug?.gridSizes === "number")
			this._service.initGridHelper(debug.gridSizes);

		this._subscriptions.push(
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
