import { describe, it, expect, vi } from "vitest";
import EventEmitter from "./EventEmitter.js";

describe("EventEmitter (Bruno Simon pattern)", () => {
  it("calls handlers with trigger arguments", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("tick", handler);
    emitter.trigger("tick", [16, 320]);
    expect(handler).toHaveBeenCalledWith(16, 320);
  });

  it("supports multiple handlers for one event", () => {
    const emitter = new EventEmitter();
    const first = vi.fn();
    const second = vi.fn();
    emitter.on("resize", first);
    emitter.on("resize", second);
    emitter.trigger("resize");
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("stops calling handlers after off()", () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("ready", handler);
    emitter.off("ready");
    emitter.trigger("ready");
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes a whole namespace with off('.namespace')", () => {
    const emitter = new EventEmitter();
    const namespaced = vi.fn();
    const base = vi.fn();
    emitter.on("tick.world", namespaced);
    emitter.on("tick", base);
    emitter.off(".world");
    emitter.trigger("tick");
    expect(namespaced).not.toHaveBeenCalled();
    expect(base).toHaveBeenCalledOnce();
  });
});
