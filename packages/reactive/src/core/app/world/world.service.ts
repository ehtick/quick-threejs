import { Light, Material, Object3D, Scene, BufferGeometry } from "three";
import { disposeMaterial } from "@quick-threejs/utils";
import { Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class WorldService {
	public scene = new Scene();
	public enabled = true;

	private _disposeObjectResources(object: Object3D) {
		const meshLike = object as Object3D & {
			geometry?: BufferGeometry;
			material?: Material | Material[];
		};

		meshLike.geometry?.dispose();

		if (Array.isArray(meshLike.material)) {
			meshLike.material.forEach((material) => disposeMaterial(material));
		} else if (meshLike.material) {
			disposeMaterial(meshLike.material);
		}

		if (object instanceof Light) object.dispose();
	}

	public dispose() {
		this.enabled = false;

		this.scene.onBeforeRender = () => {};
		this.scene.onAfterRender = () => {};

		this.scene.traverse((object) => this._disposeObjectResources(object));
		this.scene.clear();
	}
}
