/** When a screen opens, its title takes the focus, so a screen reader says where the user is and
 * the keyboard starts from the top. */
export function focusOnMount(node: HTMLElement): void {
  node.focus();
}
