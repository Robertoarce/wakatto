import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatInterface } from '../components/ChatInterface';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Header } from '../components/Header';
import { ChatSidebar } from '../components/ChatSidebar';

const Tab = createBottomTabNavigator();

// Placeholder components for now
const CharactersScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Characters Visualization</Text>
  </View>
);

const GraphScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Knowledge Graph Visualization</Text>
  </View>
);

export default function MainTabs() {
  const { conversations, currentConversation, messages } = useSelector((state: RootState) => state.conversations);
  const { showSidebar, sidebarCollapsed } = useSelector((state: RootState) => state.auth); // Assuming these states will be moved to a global state

  // Placeholder functions for now
  const onSelectConversation = () => {};
  const onToggleSidebar = () => {};
  const onToggleCollapse = () => {};
  const handleSendMessage = () => {};

  return (
    <View style={styles.fullContainer}>
      <Header />
      <View style={styles.contentContainer}>
        <ChatSidebar 
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={onSelectConversation}
          onToggleSidebar={onToggleSidebar}
          isOpen={showSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#8b5cf6',
            tabBarInactiveTintColor: '#a1a1aa',
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tab.Screen 
            name="Chat"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbox-outline" color={color} size={size} />
              ),
            }}
          >
            {() => (
              <ChatInterface 
                messages={messages}
                onSendMessage={handleSendMessage}
                showSidebar={showSidebar}
                onToggleSidebar={onToggleSidebar}
              />
            )}
          </Tab.Screen>
          <Tab.Screen 
            name="Characters"
            component={CharactersScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen 
            name="Graph"
            component={GraphScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="graph-outline" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  screenText: {
    color: 'white',
    fontSize: 24,
  },
  tabBar: {
    backgroundColor: '#171717',
    borderTopColor: '#27272a',
  },
  tabBarLabel: {
    fontSize: 12,
  },
});
