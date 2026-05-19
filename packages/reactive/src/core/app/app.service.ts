import { ProxyReceiver } from "@quick-threejs/utils";
import { inject, Lifecycle, scoped } from "tsyringe";

import {
	APP_PROPS_TOKEN,
	type AppProps,
	type OffscreenCanvasStb
} from "@/common";

@scoped(Lifecycle.ContainerScoped)
export class AppService {
	private _canvas?: HTMLCanvasElement | OffscreenCanvasStb;

	public readonly proxyReceiver = new ProxyReceiver<Record<string, unknown>>();

	public isInitialized = false;

	constructor(
		@inject(APP_PROPS_TOKEN)
		private readonly _props: AppProps
	) {}

	init() {
		const { canvas } = this._props.event || {};
		if (!canvas) throw new Error("Core App Canvas is not initialized.");

		this.canvas = canvas;
		this.isInitialized = true;
	}

	public get canvas(): OffscreenCanvasStb | HTMLCanvasElement | undefined {
		return this._canvas;
	}

	public set canvas(canvas: HTMLCanvasElement | OffscreenCanvasStb) {
		// @ts-ignore
		canvas["style"] = {
			width: canvas.width + "",
			height: canvas.height + ""
		};

		this._canvas = canvas;
	}
}
