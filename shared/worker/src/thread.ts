import { spawn, Thread, Worker } from "threads";

import {
	AwaitedSpawnedThread,
	ExposedWorkerThreadModule,
	WorkerThreadProps,
	WorkerThreadTask
} from "./types/worker.type";
import { TERMINATE_THREAD_FROM_WORKER_TOKEN } from "./tokens";

let auto_increment_unique_id = -1;

/**
 * @description
 *
 * [Threads](https://github.com/andywer/threads.js) based class.
 * Contains a worker and a spawned thread.
 *
 * - Use the `run` method to execute a {@link WorkerThreadTask Task} and initialize the {@link Worker} & {@link AwaitedSpawnedThread Thread}.
 *
 * @see https://threads.js.org/getting-started
 */
export class WorkerThread<
	T extends ExposedWorkerThreadModule = ExposedWorkerThreadModule
> {
	private _onTerminate: WorkerThreadProps["onTerminate"];
	private _onError: WorkerThreadProps["onError"];
	private _task?: WorkerThreadTask;
	private readonly _onMessage = (payload: Event) =>
		this._handleMessages(payload);

	public id = (auto_increment_unique_id += 1);
	public idle = true;
	public worker?: Worker;
	public thread?: AwaitedSpawnedThread<T>;

	constructor(props?: WorkerThreadProps) {
		this._onTerminate = props?.onTerminate;
		this._onError = props?.onError;
	}

	private _handleMessages(payload: Event) {
		if (
			payload instanceof MessageEvent &&
			payload.data?.token === TERMINATE_THREAD_FROM_WORKER_TOKEN
		)
			void this.terminate();
	}

	private async _releaseWorker() {
		this.worker?.removeEventListener("message", this._onMessage);

		if (this.thread) await Thread.terminate(this.thread);
		await this.worker?.terminate();

		this.worker = undefined;
		this.thread = undefined;
		this._task = undefined;
	}

	public async run<U extends T = T>(
		task: WorkerThreadTask
	): Promise<WorkerThread<U> | undefined> {
		if (!this.idle) await this._releaseWorker();

		try {
			const { payload, options } = task;

			this.idle = false;
			this.worker = new Worker(payload.path as string, {
				type: "module",
				...options?.worker
			});
			this.thread = await spawn<T>(this.worker, {
				timeout: 10000,
				...options?.spawn
			});
			this._task = task;

			this.worker.postMessage(payload.subject, payload.transferSubject);
			this.worker.addEventListener("message", this._onMessage);

			return this;
		} catch (err: any) {
			await this._releaseWorker();
			this.idle = true;
			this._onError?.(err);
			return undefined;
		}
	}

	public get task() {
		return this._task;
	}

	public async terminate() {
		await this._releaseWorker();
		this.idle = true;

		this._onTerminate?.();
	}
}
