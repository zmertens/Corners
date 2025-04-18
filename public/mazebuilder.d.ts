// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
  _main(_0: number, _1: number): number;
  ___set_stack_limits(_0: number, _1: number): void;
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  clone(): this;
}
export interface cli extends ClassHandle {
  stringify_from_dimens(_0: number, _1: number): string;
}

interface EmbindModule {
  cli: {};
  get(): cli | null;
}

export type MainModule = WasmModule & EmbindModule;
export default function MainModuleFactory(
  options?: unknown,
): Promise<MainModule>;
