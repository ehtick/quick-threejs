import "reflect-metadata";

import { container, inject, singleton } from "tsyringe";
import { Vector2Like } from "three";
import type { WorkerThreadModule } from "@quick-threejs/utils/dist/types/worker.type";

import { CoreController } from "./core.controller";
import { CoreComponent } from "./core.component";
import { TimerModule } from "./timer/timer.module";
import { CameraModule } from "./camera/camera.module";
import { RendererModule } from "./renderer/renderer.module";
import { SizesModule } from "./sizes/sizes.module";
import { WorldModule } from "./world/world.module";
import { DebugModule } from "./debug/debug.module";
import { LifecycleState } from "../common/enums/lifecycle.enum";
import { PROXY_EVENT_LISTENERS } from "../common/constants/event.constants";
import type { Module } from "../common/interfaces/module.interface";
import type { OffscreenCanvasWithStyle } from "../common/interfaces/canvas.interface";
import type {
	CoreModuleMessageEvent,
	CoreModuleMessageEventData
} from "./core.interface";

@singleton()
export class CoreModule implements Module, WorkerThreadModule {
	constructor(
		@inject(CoreController) private readonly controller: CoreController,
		@inject(CoreComponent) private readonly component: CoreComponent,
		@inject(TimerModule) public readonly timer: TimerModule,
		@inject(SizesModule) public readonly sizes: SizesModule,
		@inject(CameraModule) public readonly camera: CameraModule,
		@inject(WorldModule) public readonly world: WorldModule,
		@inject(RendererModule) public readonly renderer: RendererModule,
		@inject(DebugModule) public readonly debug: DebugModule
	) {
		this._initProxyEvents();

		self.addEventListener("message", this._onMessage.bind(this));
	}

	private _onMessage(event: CoreModuleMessageEvent) {
		if (!event.data?.canvas || this.component.initialized) return;

		const startTimer = !!event.data?.startTimer;
		const useDefaultCamera = !!event.data?.useDefaultCamera;
		const withMiniCamera = !!event.data?.withMiniCamera;
		const fullScreen = !!event.data?.fullScreen;

		this.init({
			...event.data,
			startTimer,
			useDefaultCamera,
			withMiniCamera,
			fullScreen
		});
	}

	public isInitialized() {
		return this.component.initialized;
	}

	public init(props: CoreModuleMessageEventData) {
		if (!props.canvas || this.component.initialized) return;
		this.component.initialized = true;

		props.canvas["style"] = {
			width: props.canvas.width + "",
			height: props.canvas.height + ""
		};
		const canvas = props.canvas as OffscreenCanvasWithStyle;

		this.component.canvas = canvas;
		this.sizes.init(canvas);
		this.timer.init(props.startTimer);
		this.camera.init(props.useDefaultCamera, props.withMiniCamera);
		this.world.init();
		this.renderer.init(canvas);
		this.debug.init(props);

		this.controller.lifecycle$$.next(LifecycleState.INITIALIZED);
	}

	private _initProxyEvents() {
		PROXY_EVENT_LISTENERS.forEach((key) => {
			this[key] = (sizes: Vector2Like) => {
				this.controller?.[key]?.(sizes);
			};
		});
	}

	public dispose() {
		this.timer.dispose();
		this.camera.dispose();
		this.renderer.dispose();
		this.sizes.dispose();
		this.world.dispose();
		self.removeEventListener("message", this._onMessage.bind(this));
		this.controller.lifecycle$$.next(LifecycleState.DISPOSED);
		this.controller.lifecycle$$.complete();
	}

	public lifecycle$() {
		return this.controller.lifecycle$;
	}
}

export const coreModule = container.resolve(CoreModule);
