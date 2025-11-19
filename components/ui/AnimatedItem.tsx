import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface AnimatedItemProps {
    children: React.ReactNode;
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export function AnimatedItem({ children, index = 0, delay = 100, style }: AnimatedItemProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(index * delay).springify().damping(15)}
            layout={Layout.springify()}
            style={style}
        >
            {children}
        </Animated.View>
    );
}
