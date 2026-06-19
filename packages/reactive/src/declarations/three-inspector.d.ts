declare module "three/examples/jsm/inspector/Inspector.js" {
	import { RendererInspector } from "three/examples/jsm/inspector/RendererInspector.js";

	export class Inspector extends RendererInspector {
		domElement: HTMLElement;
		settings: {
			_getExtensions: () => Promise<unknown[]>;
		};
		init(): void;
		show(): void;
		createParameters(name: string): {
			add(target: object, prop: string): { name(name: string): unknown };
		};
	}
}
