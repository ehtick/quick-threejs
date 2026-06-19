import { container, inject, Lifecycle, scoped } from "tsyringe";
import {
	fromEvent,
	map,
	filter,
	Subject,
	Observable,
	Subscription
} from "rxjs";

import {
	type ProxyEvent,
	APP_EXPOSED_THREAD_TOKEN,
	PROXY_EVENT_LISTENERS,
	ProxyEventHandlersBlueprint
} from "@/common";
import type { ExposedAppModule } from "../app/app.worker";
import { RegisterService } from "./register.service";

@scoped(Lifecycle.ContainerScoped)
export class RegisterController extends ProxyEventHandlersBlueprint {
	private readonly _subscriptions: Subscription[] = [];

	constructor(
		@inject(RegisterService) private readonly _service: RegisterService
	) {
		super();
	}

	public init() {
		this.dispose();

		let mainThreadApp: ExposedAppModule | undefined;

		try {
			mainThreadApp = container.resolve<ExposedAppModule>(
				APP_EXPOSED_THREAD_TOKEN
			);
		} catch {
			mainThreadApp = undefined;
		}

		for (const key of PROXY_EVENT_LISTENERS) {
			const eventHandler =
				key.startsWith("mouse") ||
				key.startsWith("pointer") ||
				key.startsWith("touch")
					? this._service.mouseEventHandler.bind(this._service)
					: key.startsWith("key")
						? this._service.keyEventHandler.bind(this._service)
						: key === "resize"
							? this._service.uiEventHandler.bind(this._service)
							: key === "wheel"
								? this._service.wheelEventHandler.bind(this._service)
								: this._service.preventDefaultHandler.bind(this._service);

			this[`${key}$$`] = new Subject<any>();

			this._subscriptions.push(
				fromEvent<MouseEvent>(
					key === "resize" ? window : this._service.canvas!,
					key
				)
					.pipe(
						map((event) => eventHandler(event as any)),
						filter((e) => (key === "keydown" && !e ? false : true))
					)
					.subscribe((event) => {
						this[`${key}$$`].next(
							event as MouseEvent &
								ProxyEvent &
								UIEvent &
								PointerEvent &
								TouchEvent &
								WheelEvent &
								KeyboardEvent
						);
					})
			);

			this[`${key}$`] = this[`${key}$$`].asObservable() as Observable<any>;
			this._subscriptions.push(
				this[`${key}$`].subscribe((event) => {
					this._service.workerThread?.thread?.[key]?.(event as any);
					mainThreadApp?.[key]?.(event as any);
				})
			);
		}
	}

	public dispose() {
		this._subscriptions.forEach((sub) => sub.unsubscribe());
		this._subscriptions.length = 0;

		for (const key of PROXY_EVENT_LISTENERS) {
			this[`${key}$$`]?.complete?.();
		}
	}
}
