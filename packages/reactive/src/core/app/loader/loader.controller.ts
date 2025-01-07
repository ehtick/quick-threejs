import { deserializeObject3D } from "@quick-threejs/utils";
import { filter, fromEvent, map, share } from "rxjs";
import { Lifecycle, scoped } from "tsyringe";

import {
	type SerializedLoadedResourcePayload,
	LoadedResourcePayload,
	LOADER_SERIALIZED_LOAD_TOKEN
} from "../../../common";
import { AnimationClip, AnimationClipJSON, Camera, Group } from "three";
import { GLTF, GLTFParser } from "three/examples/jsm/loaders/GLTFLoader";

@scoped(Lifecycle.ResolutionScoped)
export class LoaderController {
	public readonly load$ = fromEvent<
		MessageEvent<
			| {
					token: string;
					payload: SerializedLoadedResourcePayload;
			  }
			| undefined
		>
	>(self, "message").pipe(
		filter(
			(event) =>
				event.data?.token === LOADER_SERIALIZED_LOAD_TOKEN &&
				!!event.data?.payload?.resource
		),
		map((event) => {
			const { payload } = event.data || {};

			if (!!payload?.resource && payload.source.type === "gltfModel") {
				const resource = payload.resource as unknown as {
					animations?: AnimationClipJSON[];
					cameras?: string[];
					parser?: Partial<GLTFParser> & { json: GLTFParser["json"] };
					scene?: string;
					scenes?: string[];
					userData?: GLTF["userData"];
				};
				const animations = resource.animations?.map((animation) =>
					AnimationClip.parse(animation)
				);
				const cameras = resource.cameras?.map(
					(camera) => deserializeObject3D(camera) as Camera
				);
				const scene = deserializeObject3D(resource?.scene || "") as Group;
				const scenes = resource.scenes?.map(
					(scene) => deserializeObject3D(scene) as Group
				);

				return {
					...payload,
					resource: { ...resource, animations, cameras, scene, scenes }
				} as LoadedResourcePayload;
			}

			return payload as LoadedResourcePayload;
		}),
		share()
	);
	public readonly loadCompleted$ = this.load$.pipe(
		filter((payload) => payload?.toLoadCount === payload.loadedCount)
	);
}
