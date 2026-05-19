import {
	type Euler,
	type Quaternion,
	type Vector3,
	Camera,
	OrthographicCamera,
	PerspectiveCamera
} from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { type AppProps, APP_PROPS_TOKEN, DefaultCameraType } from "@/common";
import { SizesService } from "../sizes/sizes.service";

@scoped(Lifecycle.ContainerScoped)
export class CameraService {
	public instance?: Camera;
	public enabled = true;

	constructor(
		@inject(SizesService) private readonly _sizes: SizesService,
		@inject(APP_PROPS_TOKEN) private readonly _props: AppProps
	) {}

	public set aspectRatio(ratio: number) {
		if (this.instance instanceof PerspectiveCamera)
			this.instance.aspect = ratio;
		if (
			this.instance instanceof PerspectiveCamera ||
			this.instance instanceof OrthographicCamera
		)
			this.instance?.updateProjectionMatrix();
	}

	public set quaternion(quaternion: Quaternion) {
		this.instance?.quaternion.copy(quaternion);
	}

	public set position(position: Vector3) {
		this.instance?.position.copy(position);
	}

	public set rotation(rotation: Euler) {
		this.instance?.rotation.copy(rotation);
	}

	public init() {
		const { defaultCamera } = this._props.event || {};

		this.dispose();

		if (defaultCamera === DefaultCameraType.ORTHOGRAPHIC) {
			this.instance = new OrthographicCamera(
				(-this._sizes.aspect * this._sizes.frustrum) / 2,
				(this._sizes.aspect * this._sizes.frustrum) / 2,
				this._sizes.frustrum / 2,
				-this._sizes.frustrum / 2,
				-50,
				50
			);

			return;
		}

		this.instance = new PerspectiveCamera(70, this._sizes.aspect, 0.1, 100);
		this.instance.position.z = 8;
	}

	public handleStep() {
		this.aspectRatio = this._sizes.aspect;

		if (
			this.instance instanceof PerspectiveCamera ||
			this.instance instanceof OrthographicCamera
		)
			this.instance?.updateProjectionMatrix();
	}

	public dispose() {
		if (!(this.instance instanceof Camera)) return;
		if (
			this.instance instanceof PerspectiveCamera ||
			this.instance instanceof OrthographicCamera
		)
			this.instance.clearViewOffset();
		this.instance.clear();
		this.instance = undefined;
	}
}
