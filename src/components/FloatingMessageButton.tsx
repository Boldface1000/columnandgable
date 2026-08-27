import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useUnreadCount } from "@/lib/app-state";

const POS_KEY = "cg.messageButtonPos";
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a tap
const GAP = 16; // px gap kept from any edge, including the bottom
const BUTTON_SIZE = 56; // px — bigger/more noticeable than the old header icon
const BOTTOM_DEFAULT_GAP = 96; // default rest gap above the bottom edge (clears BubbleNav)

type Pos = { right: number; bottom: number };

function clampPos(pos: Pos): Pos {
  const maxRight = Math.max(GAP, window.innerWidth - BUTTON_SIZE - GAP);
  const maxBottom = Math.max(GAP, window.innerHeight - BUTTON_SIZE - GAP);
  return {
    right: Math.min(Math.max(pos.right, GAP), maxRight),
    bottom: Math.min(Math.max(pos.bottom, GAP), maxBottom),
  };
}

function loadPos(): Pos {
  if (typeof window === "undefined") return { right: GAP, bottom: BOTTOM_DEFAULT_GAP };
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) return clampPos(JSON.parse(raw) as Pos);
  } catch {
    /* fall through to default */
  }
  return clampPos({ right: GAP, bottom: BOTTOM_DEFAULT_GAP });
}

/**
 * Floating, draggable "message the operations desk" button.
 * Rests bottom-right with a gap from the bottom edge by default; the user
 * can drag it anywhere on screen and its position is remembered.
 */
export function FloatingMessageButton() {
  const navigate = useNavigate();
  const unread = useUnreadCount("user");
  const [pos, setPos] = useState<Pos>(() => loadPos());
  const dragState = useRef<{
    startX: number;
    startY: number;
    startPos: Pos;
    dragging: boolean;
    pointerId: number;
  } | null>(null);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: pos,
        dragging: false,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    state.dragging = true;
    setPos(
      clampPos({
        right: state.startPos.right - dx,
        bottom: state.startPos.bottom - dy,
      }),
    );
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const state = dragState.current;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (state?.dragging) {
        setPos((p) => {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(p));
          } catch {
            /* ignore storage failures */
          }
          return p;
        });
      } else {
        navigate({ to: "/support" });
      }
      dragState.current = null;
    },
    [navigate],
  );

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="Message the operations desk"
      style={{
        right: pos.right,
        bottom: pos.bottom,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        touchAction: "none",
      }}
      className="gold-surface fixed z-50 grid cursor-grab place-items-center rounded-full shadow-gold active:cursor-grabbing"
    >
      <MessageCircle className="size-7" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
