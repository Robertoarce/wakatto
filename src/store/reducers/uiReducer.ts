interface UIState {
  showSidebar: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  showSidebar: true,
  sidebarCollapsed: false,
};

export const uiReducer = (state = initialState, action: any): UIState => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, showSidebar: !state.showSidebar };
    case 'TOGGLE_SIDEBAR_COLLAPSE':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, showSidebar: action.payload };
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };
    default:
      return state;
  }
};

