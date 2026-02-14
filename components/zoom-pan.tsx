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
  const currentRef = React.useRef({
    scale: initialScale,
    x: 0,
    y: 0,
  });

  const targetRef = React.useRef({
    scale: initialScale,
    x: 0,
    y: 0,
  });

  const isDragging = React.useRef(false);
  const isPinching = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const targetStartRef = React.useRef({ x: 0, y: 0 });

  // Momentum & Physics
  const velocityRef = React.useRef({ x: 0, y: 0 });
  const lastTimeRef = React.useRef(0);
  // Track last frame time for Delta Time calculation
  const lastFrameTimeRef = React.useRef(0);

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

    // Use translate3d for GPU acceleration
    contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
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
      isImmediate: prev.isImmediate,
    }));
  }, []);

  const startAnimation = React.useCallback(() => {
    if (rafRef.current) return;

    lastFrameTimeRef.current = performance.now();

    const step = (timestamp: number) => {
      const dt = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Skip huge time jumps (tab inactive)
      if (dt > 100) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      // Time scale factor (normalized to ~60fps)
      const timeScale = dt / 16.667;

      const target = targetRef.current;
      const current = currentRef.current;
      const velocity = velocityRef.current;

      // 1. Apply Momentum if not interacting
      if (!isDragging.current && !isPinching.current) {
        // Friction adjusted for time
        // 0.95 is smoother than 0.92
        const friction = Math.pow(0.95, timeScale);

        if (Math.abs(velocity.x) > 0.05 || Math.abs(velocity.y) > 0.05) {
          target.x += velocity.x * timeScale;
          target.y += velocity.y * timeScale;

          velocity.x *= friction;
          velocity.y *= friction;
        } else {
          velocity.x = 0;
          velocity.y = 0;
        }
      }

      // 2. Smooth Interpolation (Lerp)
      // Adjusted lerp factors for time-independence
      const panFactor = 1 - Math.pow(1 - 0.12, timeScale);
      const zoomFactor = 1 - Math.pow(1 - 0.12, timeScale);

      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const ds = target.scale - current.scale;

      current.x += dx * panFactor;
      current.y += dy * panFactor;
      current.scale += ds * zoomFactor;

      updateDom(true);

      // 3. Stop Condition
      const isStillMoving =
        Math.abs(dx) > 0.1 ||
        Math.abs(dy) > 0.1 ||
        Math.abs(ds) > 0.0001 || // tighter zoom tolerance
        Math.abs(velocity.x) > 0.1 ||
        Math.abs(velocity.y) > 0.1;

      if (isStillMoving || isDragging.current || isPinching.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        // Snap to target to prevent micro-drifting
        current.x = target.x;
        current.y = target.y;
        current.scale = target.scale;
        updateDom(true);
        commitToState();
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [updateDom, commitToState]);

  React.useEffect(() => {
    // Only update refs from state if we aren't animating
    // This prevents state updates from "fighting" the physics loop
    if (!rafRef.current) {
      targetRef.current = {
        scale: zoomPan.scale,
        x: zoomPan.translateX,
        y: zoomPan.translateY,
      };
      // If purely state-driven (buttons), sync current immediately
      if (!zoomPan.isImmediate) {
        currentRef.current = { ...targetRef.current };
        updateDom(false);
      }
    } else {
      // If animating, ensure target matches state only if it was a button press
      if (!zoomPan.isImmediate) {
        targetRef.current = {
          scale: zoomPan.scale,
          x: zoomPan.translateX,
          y: zoomPan.translateY,
        };
      }
    }
  }, [zoomPan, updateDom]);

  // -- Zoom Controls (Button based) --

  const getContainerCenter = React.useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }, []);

  const applyZoomToPoint = React.useCallback(
    (delta: number, point: { x: number; y: number }) => {
      const prevScale = targetRef.current.scale; // Use target for calculations
      const prevX = targetRef.current.x;
      const prevY = targetRef.current.y;

      const newScale = Math.min(
        maxScale,
        Math.max(minScale, prevScale + delta),
      );
      const ratio = newScale / prevScale;

      const newX = point.x - (point.x - prevX) * ratio;
      const newY = point.y - (point.y - prevY) * ratio;

      // Update Target Ref immediately for the loop
      targetRef.current = {
        scale: newScale,
        x: newX,
        y: newY,
      };

      // Trigger state update to handle UI but keep isImmediate=false for CSS transition
      // We manually start animation to smooth the ref values
      startAnimation();

      setZoomPan({
        scale: newScale,
        translateX: newX,
        translateY: newY,
        isImmediate: false,
      });
    },
    [maxScale, minScale, startAnimation],
  );

  const zoomIn = React.useCallback(() => {
    applyZoomToPoint(zoomStep, getContainerCenter());
  }, [zoomStep, applyZoomToPoint, getContainerCenter]);

  const zoomOut = React.useCallback(() => {
    applyZoomToPoint(-zoomStep, getContainerCenter());
  }, [zoomStep, applyZoomToPoint, getContainerCenter]);

  const resetZoom = React.useCallback(() => {
    targetRef.current = { scale: initialScale, x: 0, y: 0 };
    setZoomPan({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
      isImmediate: false,
    });
    startAnimation();
  }, [initialScale, startAnimation]);

  const centerView = React.useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const contentRect = content.getBoundingClientRect();
    // Use current physical scale
    const currentScale = currentRef.current.scale;

    // Calculate unscaled dimensions
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

    targetRef.current = { scale: fitScale, x: newX, y: newY };

    setZoomPan({
      scale: fitScale,
      translateX: newX,
      translateY: newY,
      isImmediate: false,
    });
    startAnimation();
  }, [maxScale, minScale, startAnimation]);

  // -- Mouse Panning --

  React.useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || isPinching.current) return;
      e.preventDefault();

      const now = performance.now();
      const dt = now - lastTimeRef.current;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      // Velocity Calculation (Pixels per ms)
      if (dt > 0) {
        // We need instantaneous velocity
        const moveX =
          e.clientX - (lastInteractionTimeRef.current.x || e.clientX);
        const moveY =
          e.clientY - (lastInteractionTimeRef.current.y || e.clientY);

        // Simple smoothing for velocity to avoid spikes
        velocityRef.current = {
          x: moveX * 0.5, // dampening input velocity slightly
          y: moveY * 0.5,
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
        // Loop will continue to run to handle momentum
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [startAnimation]);

  const lastInteractionTimeRef = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLoading || (e.button !== 0 && e.button !== 1)) return;

    e.preventDefault();
    isDragging.current = true;

    // Kill existing momentum
    velocityRef.current = { x: 0, y: 0 };

    panStartRef.current = { x: e.clientX, y: e.clientY };
    targetStartRef.current = {
      x: targetRef.current.x,
      y: targetRef.current.y,
    };

    lastTimeRef.current = performance.now();
    // eslint-disable-next-line react-hooks/immutability
    lastInteractionTimeRef.current = { x: e.clientX, y: e.clientY };

    startAnimation();
  };

  // ... Touch logic remains mostly same, just benefits from better loop ...
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
      // Normalization for different browsers/devices
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= 800;

      const ZOOM_SENSITIVITY = 0.0015; // Slightly reduced for control
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
      velocityRef.current = { x: 0, y: 0 };

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
      startAnimation();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (!touchStartRef.current) return;

      const now = performance.now();
      // const dt = now - lastTimeRef.current; // unused locally, logic relies on lastInteraction

      if (
        e.touches.length === 1 &&
        touchStartRef.current.touches.length === 1
      ) {
        const dx = e.touches[0].clientX - touchStartRef.current.touches[0].x;
        const dy = e.touches[0].clientY - touchStartRef.current.touches[0].y;

        // Velocity for momentum on release
        const moveX =
          e.touches[0].clientX - (lastInteractionTimeRef.current.x || 0);
        const moveY =
          e.touches[0].clientY - (lastInteractionTimeRef.current.y || 0);

        velocityRef.current = {
          x: moveX * 0.5,
          y: moveY * 0.5,
        };

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
  }, [minScale, maxScale, isLoading, startAnimation]);

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
            transform: `translate3d(${zoomPan.translateX}px, ${zoomPan.translateY}px, 0) scale(${zoomPan.scale})`,
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
