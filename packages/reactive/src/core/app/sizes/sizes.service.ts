import { inject, Lifecycle, scoped } from "tsyringe";

import { type AppProps, APP_PROPS_TOKEN, ProxyEvent } from "@/common";

@scoped(Lifecycle.ContainerScoped)
export class SizesService {
	public width = 0;
	public height = 0;
	public wrapperWidth = 0;
	public wrapperHeight = 0;
	public windowWidth = 0;
	public windowHeight = 0;
	public aspect = 0;
	public pixelRatio = 1;
	public frustrum = 5;
	public enabled = true;
	public fullScreen = false;
	public hasCanvasWrapper = false;

	constructor(@inject(APP_PROPS_TOKEN) private readonly _props: AppProps) {}

	public init() {
		const {
			canvas,
			pixelRatio = 1,
			fullScreen = true,
			hasCanvasWrapper = false
		} = this._props.event || {};

		if (!canvas) throw new Error("Core App Canvas is not initialized.");

		this.height = Number(canvas.height ?? this.height);
		this.width = Number(canvas.width ?? this.width);
		this.aspect = this.width / this.height;
		this.pixelRatio = typeof pixelRatio === "number" ? pixelRatio : 1;
		this.fullScreen = fullScreen;
		this.hasCanvasWrapper = hasCanvasWrapper;
		this.enabled = true;
	}

	public handleResize(size: UIEvent & ProxyEvent) {
		this.width = size.width;
		this.height = size.height;
		this.wrapperWidth = size.wrapperWidth;
		this.wrapperHeight = size.wrapperHeight;
		this.windowWidth = size.windowWidth;
		this.windowHeight = size.windowHeight;
		this.aspect = this.fullScreen
			? size.windowWidth / size.windowHeight
			: this.hasCanvasWrapper
				? size.wrapperWidth / size.wrapperHeight
				: size.width / size.height;
	}

	public getViewPortSizes() {
		return {
			width: this.fullScreen
				? this.windowWidth
				: this.hasCanvasWrapper
					? this.wrapperWidth
					: this.width,
			height: this.fullScreen
				? this.windowHeight
				: this.hasCanvasWrapper
					? this.wrapperHeight
					: this.height
		};
	}
}
