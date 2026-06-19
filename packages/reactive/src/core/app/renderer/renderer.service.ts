import {
	Camera,
	CineonToneMapping,
	PCFSoftShadowMap,
	SRGBColorSpace,
	WebGLRenderer
} from "three";
import { WebGPURenderer } from "three/webgpu";
import { inject, Lifecycle, scoped } from "tsyringe";

import {
	type AppProps,
	APP_PROPS_TOKEN,
	AppRenderer,
	RendererType
} from "@/common";
import { WorldService } from "../world/world.service";
import { CameraService } from "../camera/camera.service";
import { SizesService } from "../sizes/sizes.service";

@scoped(Lifecycle.ContainerScoped)
export class RendererService {
	public enabled = true;
	public enabledAutoResize = true;
	public instance?: AppRenderer;

	constructor(
		@inject(WorldService) private readonly _worldService: WorldService,
		@inject(CameraService) private readonly _cameraService: CameraService,
		@inject(SizesService) private readonly _sizes: SizesService,
		@inject(APP_PROPS_TOKEN) private readonly _props: AppProps
	) {}

	public async init() {
		const { canvas } = this._props.event || {};
		if (!canvas)
			throw new Error(
				"@quick-threejs/reactive: Core App Canvas is not accessible in the Renderer Service."
			);

		const rendererOptions = {
			canvas,
			powerPreference: "high-performance" as const,
			stencil: true,
			depth: true,
			antialias: true
		};

		if (this._props.event?.renderer === RendererType.WEBGL) {
			this.instance = new WebGLRenderer(rendererOptions);
		} else {
			this.instance = new WebGPURenderer({
				...rendererOptions,
				forceWebGL: true
			});
			await this.instance.init();
		}

		this._configureRenderer();
	}

	private _configureRenderer() {
		if (!this.instance) return;

		this.instance.autoClear = false;
		this.instance.setPixelRatio(this._sizes.pixelRatio);
		this.instance.setClearColor(0x000000, 0);
		this.instance.shadowMap.enabled = true;
		this.instance.shadowMap.type = PCFSoftShadowMap;
		this.instance.outputColorSpace = SRGBColorSpace;
		this.instance.toneMapping = CineonToneMapping;
		this.instance.toneMappingExposure = 1.75;
	}

	public handleAutoResize() {
		if (!this.enabledAutoResize || !this.instance) return;

		const { width, height } = this._sizes.getViewPortSizes();

		this.instance.setPixelRatio(this._sizes.pixelRatio);
		this.instance.setSize(width, height);
	}

	public render() {
		if (!(this._cameraService.instance instanceof Camera) || !this.instance)
			return;

		const width = this._sizes.fullScreen
			? this._sizes.windowWidth
			: this._sizes.hasCanvasWrapper
				? this._sizes.wrapperWidth
				: this._sizes.width;
		const height = this._sizes.fullScreen
			? this._sizes.windowHeight
			: this._sizes.hasCanvasWrapper
				? this._sizes.wrapperHeight
				: this._sizes.height;

		this.instance.setViewport(0, 0, width, height);
		this.instance.render(
			this._worldService.scene,
			this._cameraService.instance
		);
	}
}
