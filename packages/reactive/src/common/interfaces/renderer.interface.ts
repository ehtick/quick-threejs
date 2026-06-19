import { WebGLRenderer } from "three";
import { WebGPURenderer } from "three/webgpu";

export type AppRenderer = WebGLRenderer | WebGPURenderer;
