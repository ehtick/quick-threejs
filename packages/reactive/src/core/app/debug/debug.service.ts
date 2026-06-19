import { inject, Lifecycle, scoped } from "tsyringe";
import { AxesHelper, Camera, GridHelper, PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/Addons";
import { Inspector } from "three/examples/jsm/inspector/Inspector.js";
import { WebGPURenderer } from "three/webgpu";

import { APP_PROPS_TOKEN, type AppProps, RendererType } from "@/common";
import { CameraService } from "../camera/camera.service";
import { AppService } from "../app.service";
import { WorldService } from "../world/world.service";
import { SizesService } from "../sizes/sizes.service";
import { RendererService } from "../renderer/renderer.service";

@scoped(Lifecycle.ContainerScoped)
export class DebugService {
	public enabled = false;
	public cameraControls?: OrbitControls;
	public miniCamera?: PerspectiveCamera;
	public miniCameraControls?: OrbitControls;
	public axesHelper?: AxesHelper;
	public gridHelper?: GridHelper;
	public inspector?: Inspector;

	constructor(
		@inject(AppService) private readonly _appService: AppService,
		@inject(SizesService) private readonly _sizes: SizesService,
		@inject(RendererService) private readonly _rendererService: RendererService,
		@inject(CameraService) private readonly _cameraService: CameraService,
		@inject(WorldService) private readonly _worldService: WorldService,
		@inject(APP_PROPS_TOKEN) private readonly _props: AppProps
	) {}

	private get _inspectorEnabled() {
		const { debug, mainThread, renderer } = this._props.event || {};

		return !!(
			this.enabled &&
			debug?.enableInspector &&
			renderer !== RendererType.WEBGL &&
			mainThread
		);
	}

	private _renderMiniCamera() {
		if (!this.enabled || !this.miniCamera) return;

		const { width, height } = this._sizes.getViewPortSizes();

		this._rendererService.instance?.setScissorTest(true);
		this._rendererService.instance?.setViewport(
			width - width / 3,
			height - height / 3,
			width / 3,
			height / 3
		);
		this._rendererService.instance?.setScissor(
			width - width / 3,
			height - height / 3,
			width / 3,
			height / 3
		);
		this._rendererService.instance?.render(
			this._worldService.scene,
			this.miniCamera
		);
		this._rendererService.instance?.setScissorTest(false);
	}

	public initMiniCamera() {
		this.disposeMiniCamera();

		if (!this.enabled) return;

		this.miniCamera = new PerspectiveCamera(75, this._sizes.aspect, 0.1, 500);
		this.miniCamera.position.z = 10;
		this.miniCamera.position.x = -5;
	}

	public initOrbitControl() {
		if (this.cameraControls) this.cameraControls?.dispose();

		if (!this.enabled || !(this._cameraService.instance instanceof Camera))
			return;

		if (this._cameraService.instance instanceof Camera) {
			this.cameraControls = new OrbitControls(
				this._cameraService.instance,
				this._appService.proxyReceiver as unknown as HTMLElement
			);

			this.cameraControls.rotateSpeed = 0.1;
			this.cameraControls.enableDamping = true;
		}
	}

	public initMiniCameraOrbitControls() {
		if (this.miniCameraControls) this.miniCameraControls.dispose();

		if (!this.enabled || !this.miniCamera) return;

		this.miniCameraControls = new OrbitControls(
			this.miniCamera,
			this._appService.proxyReceiver as unknown as HTMLElement
		);
		this.miniCameraControls.rotateSpeed = 0.15;
		this.miniCameraControls.enableDamping = true;
	}

	public initAxesHelper(axesSizes: number) {
		if (!this.enabled) return;

		this.axesHelper = new AxesHelper(axesSizes);
		this._worldService.scene.add(this.axesHelper);
	}

	public initGridHelper(gridSizes: number) {
		if (this.gridHelper) {
			this._worldService.scene.remove(this.gridHelper);
		}

		if (!this.enabled) return;

		this.gridHelper = new GridHelper(gridSizes, gridSizes);
		this._worldService.scene.add(this.gridHelper);
	}

	public initInspector() {
		const { debug, mainThread } = this._props.event || {};

		if (debug?.enabled && debug.enableInspector && !mainThread) {
			console.warn(
				"@quick-threejs/reactive: debug.enableInspector requires mainThread: true. " +
					"The Inspector UI needs DOM access and cannot run in an OffscreenCanvas worker."
			);
			return;
		}

		const renderer = this._rendererService.instance;
		if (!this._inspectorEnabled || !(renderer instanceof WebGPURenderer))
			return;

		const inspector = new Inspector();

		inspector.settings._getExtensions = async () => [];

		renderer.inspector = inspector as unknown as WebGPURenderer["inspector"];
		this.inspector = inspector;

		inspector.init();

		if (
			inspector.domElement.parentElement === null &&
			typeof document !== "undefined"
		) {
			const canvasParent = renderer.domElement.parentElement;
			(canvasParent ?? document.body).appendChild(inspector.domElement);
		}
	}

	public beginInspectorFrame() {
		const renderer = this._rendererService.instance;
		if (!this._inspectorEnabled || !(renderer instanceof WebGPURenderer))
			return;

		if (renderer.info.autoReset) renderer.info.reset();
		// @ts-expect-error WebGPURenderer internal node frame API
		renderer._nodes.nodeFrame.update();
		renderer.inspector.begin();
	}

	public finishInspectorFrame() {
		const renderer = this._rendererService.instance;
		if (!this._inspectorEnabled || !(renderer instanceof WebGPURenderer))
			return;

		renderer.inspector.finish();
	}

	public init() {
		const { debug } = this._props.event || {};

		this.enabled = !!debug?.enabled;
		if (!this.enabled) return;
		if (debug?.withMiniCamera) this.initMiniCamera();
		if (debug?.enableControls) {
			this.initOrbitControl();
			this.initMiniCameraOrbitControls();
		}
		if (typeof debug?.axesSizes === "number")
			this.initAxesHelper(debug.axesSizes);
		if (typeof debug?.gridSizes === "number")
			this.initGridHelper(debug.gridSizes);
		if (debug?.enableInspector) this.initInspector();
	}

	public disposeMiniCamera() {
		if (!(this.miniCamera instanceof Camera)) return;

		this.miniCamera.clearViewOffset();
		this.miniCamera.clear();
		this.miniCamera = undefined;
	}

	public update() {
		this.cameraControls?.update();
		this.miniCameraControls?.update();
		this._renderMiniCamera();
	}

	public dispose() {
		this.disposeMiniCamera();
		this.inspector = undefined;

		this.cameraControls?.dispose();
		this.cameraControls = undefined;

		this.miniCameraControls?.dispose();
		this.miniCameraControls = undefined;

		if (this.axesHelper) this._worldService.scene.remove(this.axesHelper);
		this.axesHelper?.dispose();
		this.axesHelper = undefined;

		if (this.gridHelper) this._worldService.scene.remove(this.gridHelper);
		this.gridHelper?.dispose();
		this.gridHelper = undefined;
	}
}
