/** Visible tab bar row height (excluding device bottom inset). */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export const getTabBarHeight = (bottomInset: number) =>
  TAB_BAR_CONTENT_HEIGHT + Math.max(bottomInset, 0);
