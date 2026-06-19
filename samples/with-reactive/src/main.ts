import {
	register,
	type ContainerizedApp,
	type RegisterModule,
	RendererType
} from "@quick-threejs/reactive";
import Stats from "stats.js";
import { Audio, AudioListener } from "three";

import pawnGltf from "./assets/3D/pawn.glb?url";
import matCapImg from "./assets/textures/matcap.jpg?url";
import sampleAudioUrl from "./assets/audios/sample.mp3?url";
import helvetikerFont from "./assets/fonts/helvetiker_regular.typeface.json?url";

import "./assets/css/global.css";

const isDev = import.meta.env.DEV;
const mainThread = false;
const location = new URL(
	`./main.worker.${isDev ? "ts" : "js"}`,
	import.meta.url
) as unknown as string;

if (isDev) console.log("🚧 worker location:", location);

let app: ContainerizedApp<RegisterModule> | undefined;
let sampleAudio: Audio | undefined;
let stats: Stats | undefined;
const tearDowns: (() => void)[] = [];

const addTeardown = (unSub?: { unsubscribe: () => void }) => {
	if (unSub) tearDowns.push(() => unSub.unsubscribe());
};

const runTearDowns = () => {
	tearDowns.splice(0).forEach((teardown) => teardown());
};

const playButton = document.createElement("button");
playButton.type = "button";
playButton.textContent = "Play audio";
playButton.disabled = true;

const toggleButton = document.createElement("button");
toggleButton.type = "button";
toggleButton.textContent = "Dispose";

const toolbar = document.createElement("div");
toolbar.className = "sample-toolbar";
toolbar.append(playButton, toggleButton);
document.body.appendChild(toolbar);

playButton.addEventListener("click", () => {
	sampleAudio?.stop();
	void sampleAudio?.play();
});

toggleButton.addEventListener("click", async () => {
	if (app) await disposeExperience();
	else registerApp();
});

const disposeExperience = async () => {
	runTearDowns();

	sampleAudio?.stop();
	sampleAudio = undefined;
	playButton.disabled = true;

	stats?.dom.remove();
	stats = undefined;

	if (app) {
		await app.module.dispose();
		app = undefined;
	}

	toggleButton.textContent = "Register";
};

const registerApp = () => {
	if (app) return;

	app = register({
		location,
		mainThread,
		renderer: RendererType.WEBGPU,
		loaderDataSources: [
			{
				name: "pawn",
				path: pawnGltf,
				type: "gltf"
			},
			{
				name: "matcap",
				path: matCapImg,
				type: "image"
			},
			{
				name: "sample",
				path: sampleAudioUrl,
				type: "audio"
			},
			{
				name: "helvetikerFont",
				path: helvetikerFont,
				type: "font"
			}
		],
		debug: {
			enabled: isDev,
			enableControls: true,
			enableInspector: mainThread,
			axesSizes: 5,
			gridSizes: 10
		},
		onReady: (registeredApp) => {
			if (!mainThread) {
				stats = new Stats();
				const { thread } = registeredApp.module.getWorkerThread() || {};
				stats.showPanel(0);
				document.body.appendChild(stats.dom);

				const beforeRender$ = thread?.getBeforeRender$?.();
				if (beforeRender$)
					addTeardown(
						beforeRender$.subscribe(() => {
							stats?.begin();
						})
					);

				const step$ = thread?.getStep$?.();
				if (step$)
					addTeardown(
						step$.subscribe(() => {
							stats?.end();
						})
					);
			}

			addTeardown(
				registeredApp.module.loader.getLoadCompleted$().subscribe((payload) => {
					const sample = payload.loadedResources["sample"];

					if (!(sample instanceof AudioBuffer)) return;

					const audioListener = new AudioListener();
					sampleAudio = new Audio(audioListener);
					sampleAudio.setBuffer(sample);
					playButton.disabled = false;
				})
			);
		}
	});

	toggleButton.textContent = "Dispose";
};

registerApp();
