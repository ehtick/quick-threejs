import { useEffect, useRef } from "react";
import type { ContainerizedApp, RegisterModule } from "@quick-threejs/reactive";

export function meta() {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" }
	];
}

export default function Home() {
	const appRef = useRef<ContainerizedApp<RegisterModule> | null>(null);

	useEffect(() => {
		let disposed = false;

		import("@quick-threejs/reactive").then(({ register }) => {
			if (disposed || typeof window === "undefined") return;

			appRef.current = register({
				location: new URL(
					"../core/main.worker.ts",
					import.meta.url
				) as unknown as string,
				debug: {
					enabled: true,
					axesSizes: 5,
					gridSizes: 10,
					withMiniCamera: true
				},
				onReady: () => {
					if (disposed) void appRef.current?.module.dispose();
				}
			});
		});

		return () => {
			disposed = true;
			void appRef.current?.module.dispose();
			appRef.current = null;
		};
	}, []);

	return <div />;
}
