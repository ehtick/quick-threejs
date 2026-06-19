import { animationFrames, filter, map, share, Subject, tap } from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";

import type { TimerFramePayload } from "@/common/interfaces/timer.interface";
import { TimerService } from "./timer.service";

@scoped(Lifecycle.ContainerScoped)
export class TimerController {
	private readonly _beforeStep$$ = new Subject<TimerFramePayload>();
	private _oldElapsed = 0;

	public readonly beforeStep$ = this._beforeStep$$.asObservable();
	public readonly step$ = animationFrames().pipe(
		tap(({ elapsed }) => {
			if (this._oldElapsed !== elapsed) {
				this._beforeStep$$.next(this._service.framePayload);
				this._oldElapsed = elapsed;
			}
		}),
		filter(() => this._service.enabled),
		map(() => this._service.framePayload),
		share()
	);

	constructor(@inject(TimerService) private readonly _service: TimerService) {}
}
