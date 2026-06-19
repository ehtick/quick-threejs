import { Subscription } from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";

import { type AppProps, type Module, APP_PROPS_TOKEN } from "@/common";
import { AppService } from "../app.service";
import { TimerService } from "./timer.service";
import { TimerController } from "./timer.controller";

@scoped(Lifecycle.ContainerScoped)
export class TimerModule implements Module {
	private _initialAnimationFrameId?: number;
	private _subscriptions: Subscription[] = [];

	constructor(
		@inject(TimerController) private readonly _controller: TimerController,
		@inject(TimerService) private readonly _service: TimerService,
		@inject(AppService) private readonly _appService: AppService,
		@inject(APP_PROPS_TOKEN) private readonly _props: AppProps
	) {
		this._subscriptions.push(
			this._controller.step$.subscribe(this._service.step.bind(this._service))
		);
	}

	public init(): void {
		this._service.init(this._appService.proxyReceiver);

		const { startTimer } = this._props.event || {};
		this.enabled(startTimer);
	}

	public frame() {
		return this._service.frame;
	}

	public deltaTime(value?: number) {
		if (typeof value === "number") this._service.delta = value;
		return this._service.delta;
	}

	public deltaRatio(value?: number) {
		if (typeof value === "number") this._service.deltaRatio = value;
		return this._service.deltaRatio;
	}

	public enabled(value?: boolean) {
		if (typeof value === "boolean") {
			this._service.enabled = value;
			this._service.syncEnabled();
		}
		return this._service.enabled;
	}

	public dispose() {
		if (this._initialAnimationFrameId !== undefined)
			cancelAnimationFrame(this._initialAnimationFrameId);
		this._service.enabled = false;
		this._service.syncEnabled();
		this._service.dispose();

		this._subscriptions.forEach((sub) => sub.unsubscribe());
		this._subscriptions = [];
	}

	public beforeStep$() {
		return this._controller.beforeStep$;
	}

	public step$() {
		return this._controller.step$;
	}
}
