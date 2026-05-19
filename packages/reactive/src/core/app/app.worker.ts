import type { Methods } from "@quick-threejs/utils";
import type { ExposedWorkerThreadModule } from "@quick-threejs/worker";
import { container as parentContainer } from "tsyringe";
import { expose } from "threads/worker";
import type { WorkerFunction } from "threads/dist/types/worker";

import {
	type ProxyEventListenerKeys,
	type ContainerizedApp,
	type LaunchAppProps,
	PROXY_EVENT_LISTENERS,
	CONTAINER_TOKEN,
	MessageEventAppProps,
	APP_PROPS_TOKEN,
	APP_EXPOSED_THREAD_TOKEN,
	AppProps
} from "@/common";
import { AppModule } from "./app.module";

export const launchApp = async (_props?: LaunchAppProps<AppModule>) => {
	const appProps: AppProps = { event: undefined, launch: _props };
	const container = parentContainer.createChildContainer();
	container.register(CONTAINER_TOKEN, { useValue: container });
	container.register(APP_PROPS_TOKEN, { useValue: appProps });
	const module = container.resolve(AppModule);
	const app: ContainerizedApp<AppModule> = { container, module };
	const exposedApp: ExposedAppModule = {
		...(() => {
			const proxyEventHandlers: {
				[key in ProxyEventListenerKeys]: WorkerFunction;
			} = {} as typeof proxyEventHandlers;

			PROXY_EVENT_LISTENERS.forEach((key) => {
				proxyEventHandlers[key] = module[key];
			});

			return proxyEventHandlers;
		})(),
		getProxyReceiver: module.getProxyReceiver.bind(module),
		getIsInitialized: module.getIsInitialized.bind(module),
		getBeforeStep$: module.getBeforeStep$.bind(module),
		getBeforeRender$: module.getBeforeRender$.bind(module),
		getStep$: module.getStep$.bind(module),
		getAfterRender$: module.getAfterRender$.bind(module),
		dispose: module.dispose.bind(module)
	};
	parentContainer.register(APP_EXPOSED_THREAD_TOKEN, { useValue: exposedApp });

	const handleInitMessage = (event: MessageEventAppProps) => {
		if (
			module.getIsInitialized() ||
			!event.data?.initApp ||
			!(event.data?.canvas || event.data?.mainThread)
		)
			return;

		const canvas =
			event.data.canvas ||
			appProps.launch?.canvas ||
			(event.data.mainThread
				? (self?.document?.getElementsByTagName(
						"canvas"
					)[0] as HTMLCanvasElement)
				: undefined);

		appProps.event = { ...event.data, canvas };
		module.init();
		appProps.launch?.onReady?.(app);
		self?.removeEventListener("message", handleInitMessage);
	};

	self?.addEventListener("message", handleInitMessage);

	try {
		expose(exposedApp);
	} catch (error) {
		console.warn(
			"Unable to expose the App Module.",
			error instanceof Error ? error.message : "Unknown error"
		);
	}

	return app;
};

export type ExposedAppModule = Omit<
	ExposedWorkerThreadModule<Methods<AppModule>>,
	`${ProxyEventListenerKeys}$` | "init" | "getCanvas"
>;
