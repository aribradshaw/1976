import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CAMPAIGN_TUTORIAL_STEPS, markTutorialComplete, type TutorialStep } from './tutorial';
import './TutorialOverlay.css';

type Placement = 'left' | 'right' | 'top' | 'bottom';

interface PositionedCallout {
  left: number;
  top: number;
  placement: Placement;
  width: number;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  steps?: readonly TutorialStep[];
}

const VIEWPORT_MARGIN = 12;
const CALLOUT_WIDTH = 352;
const CALLOUT_HEIGHT = 252;
const GAP = 22;

export default function TutorialOverlay({ isOpen, onClose, steps = CAMPAIGN_TUTORIAL_STEPS }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const step = steps[stepIndex];

  const measureTarget = useCallback(() => {
    if (!isOpen || !step) {
      setTargetRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(step.target);
    setTargetRect(target?.getBoundingClientRect() ?? null);
  }, [isOpen, step]);

  const closeTutorial = useCallback(() => {
    markTutorialComplete();
    onClose();
  }, [onClose]);

  const goBack = useCallback(() => setStepIndex(index => Math.max(0, index - 1)), []);
  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      closeTutorial();
      return;
    }
    setStepIndex(index => index + 1);
  }, [closeTutorial, stepIndex, steps.length]);

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStepIndex(0);
    return () => restoreFocusRef.current?.focus();
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !step) return;
    const target = document.querySelector<HTMLElement>(step.target);
    target?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });
    measureTarget();
    const frame = window.requestAnimationFrame(measureTarget);
    const settled = window.setTimeout(measureTarget, shouldReduceMotion() ? 0 : 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settled);
    };
  }, [isOpen, measureTarget, step]);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => window.requestAnimationFrame(measureTarget);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [isOpen, measureTarget]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTutorial();
      if (event.key === 'ArrowRight' && !event.altKey && !event.ctrlKey && !event.metaKey) goNext();
      if (event.key === 'ArrowLeft' && !event.altKey && !event.ctrlKey && !event.metaKey) goBack();
    };
    window.addEventListener('keydown', onKeyDown);
    window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeTutorial, goBack, goNext, isOpen]);

  const callout = useMemo(() => positionCallout(targetRect), [targetRect]);
  const pointer = useMemo(() => targetRect ? buildPointer(targetRect, callout) : null, [targetRect, callout]);

  if (!isOpen || !step) return null;

  return (
    <div className="tutorial-overlay" aria-hidden="false">
      {targetRect ? (
        <div
          className="tutorial-spotlight"
          aria-hidden="true"
          style={{
            left: Math.max(4, targetRect.left - 8),
            top: Math.max(4, targetRect.top - 8),
            width: Math.min(window.innerWidth - 8, targetRect.width + 16),
            height: Math.min(window.innerHeight - 8, targetRect.height + 16),
          }}
        />
      ) : <div className="tutorial-dimmer" aria-hidden="true" />}
      {pointer ? <div className="tutorial-pointer" aria-hidden="true" style={pointer} /> : null}
      <div
        ref={dialogRef}
        className={`tutorial-callout tutorial-callout--${callout.placement}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
        aria-live="polite"
        tabIndex={-1}
        style={{ left: callout.left, top: callout.top, width: callout.width }}
      >
        <div className="tutorial-callout__topline">
          <p>{step.eyebrow}</p>
          <span aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>{stepIndex + 1} / {steps.length}</span>
        </div>
        <h2 id="tutorial-title">{step.title}</h2>
        <p id="tutorial-description" className="tutorial-callout__description">{step.body}</p>
        <div className="tutorial-callout__controls">
          <button type="button" className="tutorial-skip" onClick={closeTutorial}>Skip tour</button>
          <div className="tutorial-callout__pagination">
            <button type="button" onClick={goBack} disabled={stepIndex === 0}>Back</button>
            <button type="button" className="tutorial-next" onClick={goNext}>
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function positionCallout(targetRect: DOMRect | null): PositionedCallout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(CALLOUT_WIDTH, viewportWidth - (VIEWPORT_MARGIN * 2));
  const height = CALLOUT_HEIGHT;
  if (!targetRect) {
    return { left: Math.max(VIEWPORT_MARGIN, (viewportWidth - width) / 2), top: Math.max(VIEWPORT_MARGIN, (viewportHeight - height) / 2), placement: 'bottom', width };
  }

  const compact = viewportWidth < 760;
  let placement: Placement = 'right';
  let left = targetRect.right + GAP;
  let top = targetRect.top + (targetRect.height / 2) - (height / 2);

  if (compact || left + width > viewportWidth - VIEWPORT_MARGIN) {
    if (!compact && targetRect.left - GAP - width >= VIEWPORT_MARGIN) {
      placement = 'left';
      left = targetRect.left - GAP - width;
    } else if (targetRect.bottom + GAP + height <= viewportHeight - VIEWPORT_MARGIN) {
      placement = 'bottom';
      left = targetRect.left + (targetRect.width / 2) - (width / 2);
      top = targetRect.bottom + GAP;
    } else {
      placement = 'top';
      left = targetRect.left + (targetRect.width / 2) - (width / 2);
      top = targetRect.top - GAP - height;
    }
  }

  return {
    left: clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
    top: clamp(top, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN),
    placement,
    width,
  };
}

function buildPointer(targetRect: DOMRect, callout: PositionedCallout): CSSProperties {
  const calloutCenterX = callout.left + (callout.width / 2);
  const calloutCenterY = callout.top + (CALLOUT_HEIGHT / 2);
  const targetCenterX = targetRect.left + (targetRect.width / 2);
  const startX = callout.placement === 'left' ? callout.left + callout.width
    : callout.placement === 'right' ? callout.left
      : calloutCenterX;
  const startY = callout.placement === 'top' ? callout.top + CALLOUT_HEIGHT
    : callout.placement === 'bottom' ? callout.top
      : calloutCenterY;
  const endX = callout.placement === 'left' ? targetRect.left
    : callout.placement === 'right' ? targetRect.right
      : targetCenterX;
  const endY = callout.placement === 'top' ? targetRect.top
    : callout.placement === 'bottom' ? targetRect.bottom
      : targetRect.top + (targetRect.height / 2);
  const distance = Math.hypot(endX - startX, endY - startY);
  return {
    left: startX,
    top: startY,
    width: distance,
    transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function shouldReduceMotion(): boolean {
  return document.documentElement.dataset.reducedMotion === 'true'
    || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
