/**
 * Geometry for a pan/zoom crop stage: a fixed-aspect frame laid over an image
 * that is scaled to cover the frame. All values are in CSS pixels of the frame,
 * except `visibleSourceRect`, which is in source-image pixels.
 */

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type Rect = Point & Size;

/** Smallest scale at which the image still covers the frame completely. */
export function coverScale(frame: Size, image: Size): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

export function scaledSize(image: Size, scale: number): Size {
  return { width: image.width * scale, height: image.height * scale };
}

/** Clamps panning so the frame never shows empty space outside the image. */
export function clampOffset(offset: Point, frame: Size, displayed: Size): Point {
  return {
    x: Math.min(0, Math.max(frame.width - displayed.width, offset.x)),
    y: Math.min(0, Math.max(frame.height - displayed.height, offset.y)),
  };
}

export function centeredOffset(frame: Size, displayed: Size): Point {
  return {
    x: (frame.width - displayed.width) / 2,
    y: (frame.height - displayed.height) / 2,
  };
}

/** Offset that keeps the frame centre on the same image point after a zoom change. */
export function offsetAfterZoom(offset: Point, frame: Size, zoomRatio: number): Point {
  const centreX = frame.width / 2;
  const centreY = frame.height / 2;
  return {
    x: centreX - (centreX - offset.x) * zoomRatio,
    y: centreY - (centreY - offset.y) * zoomRatio,
  };
}

/** Region of the source image currently framed, ready for `drawImage`. */
export function visibleSourceRect(frame: Size, offset: Point, scale: number): Rect {
  return {
    x: -offset.x / scale,
    y: -offset.y / scale,
    width: frame.width / scale,
    height: frame.height / scale,
  };
}
