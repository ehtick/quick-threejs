import { OffscreenCanvasStb } from "main";
import {
	LaunchAppProps,
	RegisterPropsBlueprint
} from "../blueprints/props.blueprint";
import { AppModule } from "@/main.worker";

export interface MessageEventAppProps
	extends MessageEvent<
		Omit<
			RegisterPropsBlueprint,
			"canvas" | "canvasWrapper" | "location" | "loaderDataSources"
		> & {
			/**
			 * The canvas element based on.
			 *
			 * @default `undefined`
			 */
			canvas?: OffscreenCanvasStb | HTMLCanvasElement;

			/**
			 * Whether the canvas has a wrapper element.
			 *
			 * @default `undefined`
			 */
			hasCanvasWrapper?: boolean;

			/**
			 * The app is initialized.
			 *
			 * @default `true`
			 */
			initApp: true;
		}
	> {}

export interface AppProps {
	event: MessageEventAppProps["data"] | undefined;
	launch: LaunchAppProps<AppModule> | undefined;
}
