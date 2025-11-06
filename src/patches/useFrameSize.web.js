// Web-compatible version of @react-navigation/elements/useFrameSize
// This avoids the require() call that breaks in browsers

import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import useLatestCallback from 'use-latest-callback';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

const FrameContext = React.createContext(undefined);

export function useFrameSize(selector, throttle) {
  const context = React.useContext(FrameContext);
  if (context == null) {
    throw new Error('useFrameSize must be used within a FrameSizeProvider');
  }
  const value = useSyncExternalStoreWithSelector(
    throttle ? context.subscribeThrottled : context.subscribe,
    context.getCurrent,
    context.getCurrent,
    selector
  );
  return value;
}

export function FrameSizeProvider({ initialFrame, children }) {
  const context = React.useContext(FrameContext);
  if (context != null) {
    return children;
  }
  return (
    <FrameSizeProviderInner initialFrame={initialFrame}>
      {children}
    </FrameSizeProviderInner>
  );
}

function FrameSizeProviderInner({ initialFrame, children }) {
  const frameRef = React.useRef({
    width: initialFrame.width,
    height: initialFrame.height,
  });

  const listeners = React.useRef(new Set());
  const getCurrent = useLatestCallback(() => frameRef.current);

  const subscribe = useLatestCallback((listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  });

  const subscribeThrottled = useLatestCallback((listener) => {
    const delay = 100;
    let timer;
    let updated = false;
    let waiting = false;

    const throttledListener = () => {
      clearTimeout(timer);
      updated = true;

      if (waiting) {
        timer = setTimeout(() => {
          if (updated) {
            updated = false;
            listener();
          }
        }, delay);
      } else {
        waiting = true;
        setTimeout(function () {
          waiting = false;
        }, delay);
        updated = false;
        listener();
      }
    };

    const unsubscribe = subscribe(throttledListener);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  });

  const context = React.useMemo(
    () => ({
      getCurrent,
      subscribe,
      subscribeThrottled,
    }),
    [subscribe, subscribeThrottled, getCurrent]
  );

  const onChange = useLatestCallback((frame) => {
    if (
      frameRef.current.height === frame.height &&
      frameRef.current.width === frame.width
    ) {
      return;
    }
    frameRef.current = { width: frame.width, height: frame.height };
    listeners.current.forEach((listener) => listener());
  });

  return (
    <>
      <FrameSizeListenerWeb onChange={onChange} />
      <FrameContext.Provider value={context}>{children}</FrameContext.Provider>
    </>
  );
}

// Web-only listener using ResizeObserver
function FrameSizeListenerWeb({ onChange }) {
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (elementRef.current == null) {
      return;
    }

    const rect = elementRef.current.getBoundingClientRect();
    onChange({
      width: rect.width,
      height: rect.height,
    });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        onChange({ width, height });
      }
    });

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onChange]);

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
      }}
    />
  );
}

