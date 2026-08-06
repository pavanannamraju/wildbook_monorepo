import { describe, expect, it } from "bun:test";
import {
  centeredOffset,
  clampOffset,
  coverScale,
  offsetAfterZoom,
  scaledSize,
  visibleSourceRect,
} from "./avatarCropGeometry";

const FRAME = { width: 240, height: 320 };

describe("avatarCropGeometry", () => {
  it("scales a landscape image to cover a portrait frame", () => {
    const scale = coverScale(FRAME, { width: 1000, height: 500 });
    expect(scale).toBeCloseTo(320 / 500);
    const displayed = scaledSize({ width: 1000, height: 500 }, scale);
    expect(displayed.height).toBeCloseTo(320);
    expect(displayed.width).toBeGreaterThanOrEqual(240);
  });

  it("centres the image inside the frame", () => {
    expect(centeredOffset(FRAME, { width: 640, height: 320 })).toEqual({ x: -200, y: 0 });
  });

  it("never lets panning expose space outside the image", () => {
    const displayed = { width: 640, height: 320 };
    expect(clampOffset({ x: 50, y: 20 }, FRAME, displayed)).toEqual({ x: 0, y: 0 });
    expect(clampOffset({ x: -900, y: -50 }, FRAME, displayed)).toEqual({ x: -400, y: 0 });
    expect(clampOffset({ x: -120, y: 0 }, FRAME, displayed)).toEqual({ x: -120, y: 0 });
  });

  it("keeps the frame centre anchored when zooming", () => {
    const zoomed = offsetAfterZoom({ x: -200, y: 0 }, FRAME, 2);
    expect(zoomed).toEqual({ x: -520, y: -160 });
  });

  it("maps a centred frame back to source pixels", () => {
    const image = { width: 1000, height: 500 };
    const scale = coverScale(FRAME, image);
    const displayed = scaledSize(image, scale);
    const rect = visibleSourceRect(FRAME, centeredOffset(FRAME, displayed), scale);
    expect(rect.height).toBeCloseTo(image.height);
    expect(rect.width).toBeCloseTo(image.height * (FRAME.width / FRAME.height));
    expect(rect.x).toBeCloseTo((image.width - rect.width) / 2);
    expect(rect.y).toBeCloseTo(0);
    expect(rect.width / rect.height).toBeCloseTo(FRAME.width / FRAME.height);
  });

  it("crops a smaller region as zoom increases", () => {
    const image = { width: 1000, height: 500 };
    const baseScale = coverScale(FRAME, image);
    const wide = visibleSourceRect(FRAME, { x: 0, y: 0 }, baseScale);
    const tight = visibleSourceRect(FRAME, { x: 0, y: 0 }, baseScale * 2);
    expect(tight.width).toBeCloseTo(wide.width / 2);
    expect(tight.height).toBeCloseTo(wide.height / 2);
  });
});
