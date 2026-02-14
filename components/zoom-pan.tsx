"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ZoomPanState {
  scale: number;
  translateX: number;
  translateY: number;
  isImmediate: boolean;
}

export interface ZoomPanProps {
  children: React.ReactNode;
  className?: string;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  zoomStep?: number;
  controls?: (api: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    centerView: () => void;
    scalePercent: number;
  }) => React.ReactNode;
  isLoading?: boolean;
  loadingFallback?: React.ReactNode;
}

export function ZoomPan({
  children,
  className,
  minScale = 0.1,
  maxScale = 5,
  initialScale = 1,
  zoomStep = 0.1,
  controls,
  isLoading = false,
  loadingFallback,
}: ZoomPanProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // -- State --
  // We keep React state for the "committed" values (for UI controls).
  // During gestures, we bypass this and update the DOM directly.
  const [zoomPan, setZoomPan] = React.useState<ZoomPanState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
    isImmediate: false,
  });

  // -- Refs for High-Perf Updates --
  // currentRef: The actual value currently applied to the DOM
  const currentRef = React.useRef({
    scale: initialScale,
    x: 0,
    y: 0,
  });

  // targetRef: Where the user wants to go (updated by gestures/buttons)
  const targetRef = React.useRef({
    scale: initialScale,
    x: 0,
    y: 0,
  });

  const isDragging = React.useRef(false);
  const isPinching = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const targetStartRef = React.useRef({ x: 0, y: 0 });

  // Momentum
  const velocityRef = React.useRef({ x: 0, y: 0 });
  const lastTimeRef = React.useRef(0);
  const lastInteractionTimeRef = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef<number | null>(null);

  // Touch
  const touchStartRef = React.useRef<{
    touches: { x: number; y: number }[];
    distance: number;
    center: { x: number; y: number };
    scale: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  // -- Physics / Animation Loop --

  // Sync DOM directly from currentRef
  const updateDom = React.useCallback((isImmediate = true) => {
    if (!contentRef.current) return;
    const { x, y, scale } = currentRef.current;

    contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    contentRef.current.style.transition = isImmediate
      ? "none"
      : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
  }, []);

  // Sync CurrentRef -> State (For UI controls)
  const commitToState = React.useCallback(() => {
    setZoomPan((prev) => ({
      scale: currentRef.current.scale,
      translateX: currentRef.current.x,
      translateY: currentRef.current.y,
      isImmediate: prev.isImmediate, // Keep whatever transition mode we were in
    }));
  }, []);

  const startAnimation = React.useCallback(() => {
    if (rafRef.current) return;

    const step = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const velocity = velocityRef.current;

      // 1. Apply Momentum if not dragging
      if (!isDragging.current && !isPinching.current) {
        if (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.y) > 0.01) {
          target.x += velocity.x;
          target.y += velocity.y;
          velocity.x *= 0.92; // Friction
          velocity.y *= 0.92;
        } else {
          velocity.x = 0;
          velocity.y = 0;
        }
      }

      // 2. Interpolate (Lerp) actual towards target for "Slow Easing"
      // Panning easing
      const lerpPan = 0.1;
      // Zoom easing
      const lerpZoom = 0.06;

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const ds = target.scale - current.scale;

      current.x += dx * lerpPan;
      current.y += dy * lerpPan;
      current.scale += ds * lerpZoom;

      updateDom(true);

      // 3. Check if we should stop
      const isStillMoving =
        Math.abs(dx) > 0.1 ||
        Math.abs(dy) > 0.1 ||
        Math.abs(ds) > 0.001 ||
        Math.abs(velocity.x) > 0.1 ||
        Math.abs(velocity.y) > 0.1;

      if (isStillMoving || isDragging.current || isPinching.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        commitToState();
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [updateDom, commitToState]);

  React.useEffect(() => {
    targetRef.current = {
      scale: zoomPan.scale,
      x: zoomPan.translateX,
      y: zoomPan.translateY,
    };

    if (zoomPan.isImmediate) {
      // For gestures, the loop is already running or will be started
      startAnimation();
    } else {
      // For buttons, use CSS transitions for consistency, but sync internal Refs
      currentRef.current = { ...targetRef.current };
      updateDom(false);
    }
  }, [zoomPan, updateDom, startAnimation]);

  // -- Zoom Controls (Button based) --

  const getContainerCenter = React.useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }, []);

  const applyZoomToPoint = React.useCallback(
    (delta: number, point: { x: number; y: number }) => {
      const prevScale = zoomPan.scale;
      const prevX = zoomPan.translateX;
      const prevY = zoomPan.translateY;

      const newScale = Math.min(
        maxScale,
        Math.max(minScale, prevScale + delta),
      );
      const ratio = newScale / prevScale;

      const newX = point.x - (point.x - prevX) * ratio;
      const newY = point.y - (point.y - prevY) * ratio;

      // Update via React state to trigger smooth transition
      setZoomPan({
        scale: newScale,
        translateX: newX,
        translateY: newY,
        isImmediate: false,
      });
    },
    [maxScale, minScale, zoomPan.scale, zoomPan.translateX, zoomPan.translateY],
  );

  const zoomIn = React.useCallback(() => {
    applyZoomToPoint(zoomStep, getContainerCenter());
  }, [zoomStep, applyZoomToPoint, getContainerCenter]);

  const zoomOut = React.useCallback(() => {
    applyZoomToPoint(-zoomStep, getContainerCenter());
  }, [zoomStep, applyZoomToPoint, getContainerCenter]);

  const resetZoom = React.useCallback(() => {
    setZoomPan({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
      isImmediate: false,
    });
  }, [initialScale]);

  const centerView = React.useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const contentRect = content.getBoundingClientRect();
    // Unscaled dimensions
    const currentScale = zoomPan.scale;
    const contentWidth = contentRect.width / currentScale;
    const contentHeight = contentRect.height / currentScale;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const fitScale = Math.min(
      maxScale,
      Math.max(minScale, Math.min(scaleX, scaleY)),
    );

    const newX = (containerWidth - contentWidth * fitScale) / 2;
    const newY = (containerHeight - contentHeight * fitScale) / 2;

    setZoomPan({
      scale: fitScale,
      translateX: newX,
      translateY: newY,
      isImmediate: false,
    });
  }, [maxScale, minScale, zoomPan.scale]);

  // -- Mouse Panning --

  React.useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || isPinching.current) return;
      e.preventDefault();

      const now = performance.now();
      const dt = now - lastTimeRef.current;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      if (dt > 0) {
        velocityRef.current = {
          x: e.clientX - lastInteractionTimeRef.current.x || 0,
          y: e.clientY - lastInteractionTimeRef.current.y || 0,
        };
      }

      targetRef.current.x = targetStartRef.current.x + dx;
      targetRef.current.y = targetStartRef.current.y + dy;

      lastTimeRef.current = now;
      lastInteractionTimeRef.current = { x: e.clientX, y: e.clientY };
      startAnimation();
    };

    const handleWindowMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [updateDom, startAnimation]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLoading || (e.button !== 0 && e.button !== 1)) return;

    e.preventDefault();
    isDragging.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    targetStartRef.current = {
      x: targetRef.current.x,
      y: targetRef.current.y,
    };
    lastTimeRef.current = performance.now();
    lastInteractionTimeRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    startAnimation();
  };

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= 800;

      const ZOOM_SENSITIVITY = 0.002;
      const scaleFactor = Math.exp(-delta * ZOOM_SENSITIVITY);

      const target = targetRef.current;
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, target.scale * scaleFactor),
      );

      const ratio = newScale / target.scale;
      target.x = mouseX - (mouseX - target.x) * ratio;
      target.y = mouseY - (mouseY - target.y) * ratio;
      target.scale = newScale;

      startAnimation();
    };

    const onTouchStart = (e: TouchEvent) => {
      const { x, y, scale } = targetRef.current;

      if (e.touches.length === 1) {
        isDragging.current = true;
        isPinching.current = false;
        touchStartRef.current = {
          touches: [{ x: e.touches[0].clientX, y: e.touches[0].clientY }],
          distance: 0,
          center: { x: 0, y: 0 },
          scale,
          translateX: x,
          translateY: y,
        };
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        isPinching.current = true;
        const center = getTouchCenter(e.touches);
        touchStartRef.current = {
          touches: [
            { x: e.touches[0].clientX, y: e.touches[0].clientY },
            { x: e.touches[1].clientX, y: e.touches[1].clientY },
          ],
          distance: getTouchDistance(e.touches),
          center,
          scale,
          translateX: x,
          translateY: y,
        };
      }
      lastTimeRef.current = performance.now();
      lastInteractionTimeRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      velocityRef.current = { x: 0, y: 0 };
      startAnimation();
    };

    const onTouchMove = (e: TouchEvent) => {
      // PREVENT BODY SCROLLING:
      if (e.cancelable) e.preventDefault();

      if (!touchStartRef.current) return;

      const now = performance.now();
      const dt = now - lastTimeRef.current;

      if (
        e.touches.length === 1 &&
        touchStartRef.current.touches.length === 1
      ) {
        const dx = e.touches[0].clientX - touchStartRef.current.touches[0].x;
        const dy = e.touches[0].clientY - touchStartRef.current.touches[0].y;

        if (dt > 0) {
          velocityRef.current = {
            x: e.touches[0].clientX - lastInteractionTimeRef.current.x || 0,
            y: e.touches[0].clientY - lastInteractionTimeRef.current.y || 0,
          };
        }

        targetRef.current.x = touchStartRef.current.translateX + dx;
        targetRef.current.y = touchStartRef.current.translateY + dy;

        lastInteractionTimeRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
      // Pinch
      else if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
        const newDist = getTouchDistance(e.touches);
        const newCenter = getTouchCenter(e.touches);
        const rect = container.getBoundingClientRect();

        const scaleRatio = newDist / touchStartRef.current.distance;
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, touchStartRef.current.scale * scaleRatio),
        );

        const oldScale = touchStartRef.current.scale;
        const oldX = touchStartRef.current.translateX;
        const oldY = touchStartRef.current.translateY;

        const oldCenterRelX = touchStartRef.current.center.x - rect.left;
        const oldCenterRelY = touchStartRef.current.center.y - rect.top;
        const newCenterRelX = newCenter.x - rect.left;
        const newCenterRelY = newCenter.y - rect.top;

        const contentX = (oldCenterRelX - oldX) / oldScale;
        const contentY = (oldCenterRelY - oldY) / oldScale;

        targetRef.current.scale = newScale;
        targetRef.current.x = newCenterRelX - contentX * newScale;
        targetRef.current.y = newCenterRelY - contentY * newScale;
      }

      lastTimeRef.current = now;
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      isPinching.current = false;
      touchStartRef.current = null;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [minScale, maxScale, isLoading, updateDom, startAnimation, zoomPan]); // Added zoomPan to dependencies

  const [api, setApi] = React.useState<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    centerView: () => void;
    scalePercent: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    setApi({
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
      resetZoom: () => resetZoom(),
      centerView: () => centerView(),
      scalePercent: Math.round(zoomPan.scale * 100),
    });
  }, [zoomIn, zoomOut, resetZoom, centerView, zoomPan.scale]);

  return (
    <div className={cn("flex flex-col", className)}>
      {controls && api && controls(api)}

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing touch-none select-none"
        onMouseDown={handleMouseDown}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${zoomPan.translateX}px, ${zoomPan.translateY}px) scale(${zoomPan.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
            transition: zoomPan.isImmediate
              ? "none"
              : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          className="inline-flex origin-top-left [&_svg]:max-w-full"
        >
          {children}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
            {loadingFallback || (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
