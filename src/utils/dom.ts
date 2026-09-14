export function scrollIntoViewCentered(el: HTMLElement) {
  let parent = el.parentElement;

  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflowY)) break;
    parent = parent.parentElement;
  }

  if (!parent) {
    return;
  }

  const parentRect = parent.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const scrollTop =
    parent.scrollTop +
    (elRect.top - parentRect.top) -
    (parentRect.height / 2 - elRect.height / 2);

  parent.scrollTo({ top: scrollTop, behavior: "smooth" });
}
