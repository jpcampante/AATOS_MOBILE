import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PRODUCT_TABS, ProductTabId } from '../../data/productNavigation';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing } from '../../theme';

type ProductTabTransitionProps = {
  activeTab: ProductTabId;
  renderScreen: (tab: ProductTabId) => ReactNode;
};

const SLIDE_DISTANCE = 28;

function tabIndex(tab: ProductTabId) {
  return PRODUCT_TABS.findIndex((item) => item.id === tab);
}

export function ProductTabTransition({ activeTab, renderScreen }: ProductTabTransitionProps) {
  const [displayTab, setDisplayTab] = useState(activeTab);
  const progress = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);
  const previousTab = useRef(activeTab);
  const transitionRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (activeTab === previousTab.current) {
      return;
    }

    const fromIndex = tabIndex(previousTab.current);
    const toIndex = tabIndex(activeTab);
    direction.current = toIndex >= fromIndex ? 1 : -1;
    previousTab.current = activeTab;

    transitionRef.current?.stop();
    progress.stopAnimation();

    transitionRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: motionDuration.fast,
      easing: motionEasing.accelerateSoft,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    });

    transitionRef.current.start(() => {
      // Always swap tab even if the out-animation was interrupted — otherwise
      // the nav highlights Auria while the screen stays on Insights (blank/stuck).
      setDisplayTab(activeTab);
      progress.setValue(0);

      transitionRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: motionDuration.base,
        easing: motionEasing.standard,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      });
      transitionRef.current.start();
    });
  }, [activeTab, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_DISTANCE * direction.current, 0],
  });

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.screen,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {renderScreen(displayTab)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
  },
});
