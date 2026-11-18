import { ease } from "@animate-ui/react/utils/motion";

export const CLIP =
  ":root[data-page-transition]::view-transition-old(root){display:none}:root[data-page-transition]::view-transition-new(root){animation:none}" +
  "::view-transition-image-pair(*.page-transition){overflow:clip}" +
  "::view-transition-group(*.page-transition-shared){z-index:1;overflow:clip}" +
  "::view-transition-old(*.page-transition-shared),::view-transition-new(*.page-transition-shared){height:100%;object-fit:cover}";

export const SHARE = { duration: 0.45, ease: ease.resize };

export const radii = new Map<string, string>();

// Only a page change hides the old page: other view transitions (a theme
// switch) keep theirs.
let marks = 0;

export function markRoot() {
  const root = document.documentElement;
  const mark = ++marks;
  root.setAttribute("data-page-transition", "");
  const transition = (
    document as Document & { activeViewTransition?: ViewTransition | null }
  ).activeViewTransition;
  const done = transition
    ? transition.finished
    : new Promise((resolve) => requestAnimationFrame(resolve)).then(() =>
        Promise.all(
          root
            .getAnimations({ subtree: true })
            .filter((animation) =>
              (
                animation.effect as KeyframeEffect | null
              )?.pseudoElement?.startsWith("::view-transition"),
            )
            .map((animation) => animation.finished),
        ),
      );
  void done
    .catch(() => {})
    .finally(() => {
      if (mark === marks) root.removeAttribute("data-page-transition");
    });
}

export function morphRadius(
  name: string,
  from: string | undefined,
  to: string,
) {
  if (!from || from === to) return;
  const animation = document.documentElement.animate(
    { borderRadius: [from, to] },
    {
      pseudoElement: `::view-transition-group(${name})`,
      duration: SHARE.duration * 1000,
      easing: `cubic-bezier(${SHARE.ease.join(",")})`,
      fill: "both",
    },
  );
  const transition = (
    document as Document & { activeViewTransition?: ViewTransition | null }
  ).activeViewTransition;
  transition?.finished.finally(() => animation.cancel());
}

export function frameOf(
  element: HTMLElement,
  point?: { x: number; y: number },
) {
  const rect = element.getBoundingClientRect();
  const top = Math.min(Math.max(0, -rect.top), rect.height);
  const bottom = Math.max(top, Math.min(rect.height, innerHeight - rect.top));
  return {
    width: rect.width,
    top,
    bottom,
    x: point ? point.x - rect.left : rect.width / 2,
    y: point ? point.y - rect.top : (top + bottom) / 2,
  };
}

export function backgroundOf(element: HTMLElement) {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const color = getComputedStyle(node).backgroundColor;
    if (color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color))
      return color;
  }
  return "canvas";
}

export function clipRadius(element: HTMLElement) {
  const own = getComputedStyle(element).borderRadius;
  if (own !== "0px") return own;
  let parent = element.parentElement;
  while (parent && getComputedStyle(parent).overflow === "visible")
    parent = parent.parentElement;
  if (!parent) return "0px";
  const style = getComputedStyle(parent);
  const outer = parent.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const top = parseFloat(style.borderTopWidth);
  const right = parseFloat(style.borderRightWidth);
  const bottom = parseFloat(style.borderBottomWidth);
  const left = parseFloat(style.borderLeftWidth);
  const touches = {
    top: rect.top - (outer.top + top) < 1,
    right: outer.right - right - rect.right < 1,
    bottom: outer.bottom - bottom - rect.bottom < 1,
    left: rect.left - (outer.left + left) < 1,
  };
  const corner = (radius: string, a: boolean, b: boolean, border: number) =>
    a && b ? `${Math.max(0, parseFloat(radius) - border)}px` : "0px";
  return [
    corner(
      style.borderTopLeftRadius,
      touches.top,
      touches.left,
      Math.max(top, left),
    ),
    corner(
      style.borderTopRightRadius,
      touches.top,
      touches.right,
      Math.max(top, right),
    ),
    corner(
      style.borderBottomRightRadius,
      touches.bottom,
      touches.right,
      Math.max(bottom, right),
    ),
    corner(
      style.borderBottomLeftRadius,
      touches.bottom,
      touches.left,
      Math.max(bottom, left),
    ),
  ].join(" ");
}
