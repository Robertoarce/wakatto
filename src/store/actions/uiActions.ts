export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
export const TOGGLE_SIDEBAR_COLLAPSE = 'TOGGLE_SIDEBAR_COLLAPSE';
export const SET_SIDEBAR_OPEN = 'SET_SIDEBAR_OPEN';
export const SET_SIDEBAR_COLLAPSED = 'SET_SIDEBAR_COLLAPSED';
export const SET_FULLSCREEN = 'SET_FULLSCREEN';

export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR,
});

export const toggleSidebarCollapse = () => ({
  type: TOGGLE_SIDEBAR_COLLAPSE,
});

export const setSidebarOpen = (isOpen: boolean) => ({
  type: SET_SIDEBAR_OPEN,
  payload: isOpen,
});

export const setSidebarCollapsed = (isCollapsed: boolean) => ({
  type: SET_SIDEBAR_COLLAPSED,
  payload: isCollapsed,
});

export const setFullscreen = (isFullscreen: boolean) => ({
  type: SET_FULLSCREEN,
  payload: isFullscreen,
});

