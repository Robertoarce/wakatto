import { Dimensions } from 'react-native';

interface UIState {
  showSidebar: boolean;
  sidebarCollapsed: boolean;
  isFullscreen: boolean;
}

// Check if mobile on initial load - hide sidebar by default on mobile
const isMobileInitial = Dimensions.get('window').width < 768;

const initialState: UIState = {
  showSidebar: !isMobileInitial, // Hidden on mobile, shown on desktop
  sidebarCollapsed: false,
  isFullscreen: false,
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
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    default:
      return state;
  }
};

