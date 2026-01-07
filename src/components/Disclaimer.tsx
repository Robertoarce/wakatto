/**
 * Terms of Use Component
 * 
 * Comprehensive legal terms and disclaimer for Wakatto app covering:
 * - Terms and Conditions of use
 * - Mental health advisory
 * - AI character representations
 * - User responsibilities
 * - Privacy and data handling
 * - Limitation of liability
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../constants/Layout';

interface DisclaimerProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

interface DisclaimerSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

const DisclaimerSection: React.FC<DisclaimerSectionProps> = ({
  icon,
  iconColor,
  title,
  children,
}) => {
  const { fonts, spacing } = useResponsive();
  
  return (
    <View style={[styles.section, { marginBottom: spacing.lg }]}>
      <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { fontSize: fonts.md }]}>{title}</Text>
      </View>
      <View style={[styles.sectionContent, { paddingLeft: spacing.xl + spacing.sm }]}>
        {children}
      </View>
    </View>
  );
};

export const Disclaimer: React.FC<DisclaimerProps> = ({
  visible,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  const { fonts, spacing, layout, isMobile } = useResponsive();
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToEnd) {
      setHasScrolledToEnd(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          { 
            maxWidth: isMobile ? '100%' : 700,
            maxHeight: isMobile ? '95%' : '90%',
            margin: isMobile ? 0 : spacing.xl,
            borderRadius: isMobile ? 0 : 16,
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { padding: spacing.lg }]}>
            <View style={styles.headerContent}>
              <Ionicons name="document-text" size={28} color="#8b5cf6" />
              <Text style={[styles.title, { fontSize: fonts.xl, marginLeft: spacing.sm }]}>
                Terms of Use
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close terms"
            >
              <Ionicons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.content, { padding: spacing.lg }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Terms & Conditions */}
            <DisclaimerSection
              icon="checkbox"
              iconColor="#8b5cf6"
              title="Terms & Conditions"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                By accessing and using Wakatto ("the App"), you accept and agree to be 
                bound by the following terms and conditions:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.sm }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>1. Acceptance:</Text> By creating an account or 
                  using the App, you confirm that you accept these Terms of Use and agree 
                  to comply with them.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>2. Eligibility:</Text> You must be at least 18 
                  years old to use this App. If you are under 18, you may only use the App 
                  with parental or guardian consent and supervision.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>3. Account Security:</Text> You are responsible 
                  for maintaining the confidentiality of your account credentials and for 
                  all activities under your account.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>4. Acceptable Use:</Text> You agree to use the 
                  App only for lawful purposes and in accordance with these Terms. You must 
                  not use the App in any way that is unlawful, harmful, or fraudulent.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>5. Prohibited Conduct:</Text> You may not: (a) 
                  attempt to gain unauthorized access to the App; (b) use the App to harass, 
                  abuse, or harm others; (c) upload malicious code or content; (d) violate 
                  any applicable laws or regulations.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>6. Intellectual Property:</Text> All content, 
                  features, and functionality of the App are owned by Wakatto and are 
                  protected by intellectual property laws. You may not copy, modify, or 
                  distribute any part of the App without permission.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>7. Termination:</Text> We reserve the right to 
                  suspend or terminate your access to the App at any time, without notice, 
                  for conduct that we believe violates these Terms or is harmful to other 
                  users or the App.
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  <Text style={styles.bold}>8. Modifications:</Text> We may update these 
                  Terms from time to time. Continued use of the App after changes constitutes 
                  acceptance of the modified Terms.
                </Text>
              </View>
            </DisclaimerSection>

            {/* Mental Health Warning - MOST IMPORTANT */}
            <DisclaimerSection
              icon="medical"
              iconColor="#ef4444"
              title="Not a Mental Health Service"
            >
              <Text style={[styles.warningText, { fontSize: fonts.sm }]}>
                ⚠️ <Text style={styles.bold}>IMPORTANT:</Text> Wakatto is NOT a substitute for 
                professional mental health care, psychological counseling, therapy, or 
                medical advice.
              </Text>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                The AI characters in this app are designed for entertainment, 
                self-reflection, and journaling purposes only. They are not licensed 
                therapists, psychologists, psychiatrists, or medical professionals.
              </Text>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                <Text style={styles.bold}>If you are experiencing:</Text>
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Thoughts of self-harm or suicide
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Severe depression, anxiety, or emotional distress
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • A mental health crisis of any kind
                </Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                <Text style={styles.bold}>Please seek help immediately</Text> from a qualified 
                mental health professional, call your local emergency services, or contact 
                a crisis helpline.
              </Text>
            </DisclaimerSection>

            {/* Character Representations */}
            <DisclaimerSection
              icon="people"
              iconColor="#f59e0b"
              title="Fictional AI Characters"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                <Text style={styles.bold}>The "Wakattors" (AI characters) in this application 
                are entirely fictional creations</Text>, even when they may be inspired by or 
                named after real historical figures, celebrities, or fictional characters from 
                other media.
              </Text>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                These AI characters:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Do NOT represent</Text> the actual thoughts, 
                  opinions, beliefs, or personality of any real person, living or deceased
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Are NOT endorsed</Text> by, affiliated with, or 
                  connected to any real individuals they may be inspired by
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Are creative interpretations</Text> generated by 
                  artificial intelligence, not accurate portrayals
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>May generate content</Text> that is factually 
                  incorrect, historically inaccurate, or completely invented
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Should NOT be relied upon</Text> for factual 
                  information about the people or characters they may resemble
                </Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                Any resemblance to real persons, living or dead, or to other fictional 
                characters is used for entertainment purposes only and does not imply any 
                connection to or endorsement by such persons or rights holders.
              </Text>
            </DisclaimerSection>

            {/* AI Limitations */}
            <DisclaimerSection
              icon="hardware-chip"
              iconColor="#3b82f6"
              title="AI Limitations & Accuracy"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                Wakatto uses artificial intelligence to generate responses. AI technology 
                has inherent limitations:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Responses may contain <Text style={styles.bold}>factual errors, 
                  hallucinations, or misinformation</Text>
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • The AI may <Text style={styles.bold}>misunderstand context</Text> or 
                  provide inappropriate responses
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Information provided should <Text style={styles.bold}>NOT be treated 
                  as fact</Text> without independent verification
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • The AI <Text style={styles.bold}>cannot truly understand</Text> emotions 
                  or provide genuine empathy
                </Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                Always verify important information from authoritative sources and use 
                critical thinking when engaging with AI-generated content.
              </Text>
            </DisclaimerSection>

            {/* Entertainment Purpose */}
            <DisclaimerSection
              icon="game-controller"
              iconColor="#10b981"
              title="Entertainment & Self-Reflection"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                Wakatto is designed for:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Entertainment</Text> and creative expression
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Personal journaling</Text> and self-reflection
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Exploration of ideas</Text> through conversation
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Creative writing</Text> inspiration
                </Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                It is not intended to replace human connection, professional services, 
                or authoritative sources of information.
              </Text>
            </DisclaimerSection>

            {/* User Responsibilities */}
            <DisclaimerSection
              icon="person-circle"
              iconColor="#8b5cf6"
              title="User Responsibilities"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                By using Wakatto, you agree to:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Use the app <Text style={styles.bold}>responsibly</Text> and for lawful 
                  purposes only
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Not rely</Text> on AI responses for medical, 
                  legal, financial, or other professional advice
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Seek <Text style={styles.bold}>professional help</Text> when needed 
                  for mental health concerns
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Understand that AI characters are <Text style={styles.bold}>
                  fictional</Text> and not real people
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Be <Text style={styles.bold}>18 years or older</Text>, or have parental 
                  consent to use this app
                </Text>
              </View>
            </DisclaimerSection>

            {/* Privacy Note */}
            <DisclaimerSection
              icon="lock-closed"
              iconColor="#06b6d4"
              title="Privacy & Data"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                Your conversations are stored to provide continuity and improve your 
                experience. While we take security seriously:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • <Text style={styles.bold}>Do not share</Text> sensitive personal 
                  information, passwords, or financial data
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Conversations may be processed by <Text style={styles.bold}>third-party 
                  AI providers</Text> (OpenAI, Anthropic, Google)
                </Text>
              </View>
            </DisclaimerSection>

            {/* Legal */}
            <DisclaimerSection
              icon="document-text"
              iconColor="#71717a"
              title="Limitation of Liability"
            >
              <Text style={[styles.paragraph, { fontSize: fonts.sm }]}>
                To the maximum extent permitted by law, Wakatto and its creators shall 
                not be liable for any direct, indirect, incidental, consequential, or 
                special damages arising from:
              </Text>
              <View style={[styles.bulletList, { marginTop: spacing.xs }]}>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Your use of or reliance on AI-generated content
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Actions taken based on conversations with AI characters
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Inaccurate, misleading, or inappropriate AI responses
                </Text>
                <Text style={[styles.bulletItem, { fontSize: fonts.sm }]}>
                  • Any harm resulting from use of this application
                </Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: fonts.sm, marginTop: spacing.sm }]}>
                This app is provided "as is" without warranties of any kind.
              </Text>
            </DisclaimerSection>

            {/* Last Updated */}
            <View style={[styles.footer, { marginTop: spacing.lg, paddingTop: spacing.lg }]}>
              <Text style={[styles.footerText, { fontSize: fonts.xs }]}>
                Last updated: January 2026
              </Text>
              <Text style={[styles.footerText, { fontSize: fonts.xs }]}>
                By using Wakatto, you acknowledge that you have read, understood, and 
                agree to these Terms of Use.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actions, { padding: spacing.lg }]}>
            {showAcceptButton ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.acceptButton,
                    !hasScrolledToEnd && styles.acceptButtonDisabled,
                  ]}
                  onPress={onAccept}
                  disabled={!hasScrolledToEnd}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={hasScrolledToEnd ? "#fff" : "#71717a"} 
                  />
                  <Text style={[
                    styles.acceptButtonText,
                    !hasScrolledToEnd && styles.acceptButtonTextDisabled,
                  ]}>
                    I Understand & Accept
                  </Text>
                </TouchableOpacity>
                {!hasScrolledToEnd && (
                  <Text style={[styles.scrollHint, { fontSize: fonts.xs }]}>
                    Please scroll to read the full Terms of Use
                  </Text>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.closeButtonLarge}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Terms of Use button component for use in Settings or other screens
 */
export const DisclaimerButton: React.FC<{ style?: any }> = ({ style }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { fonts, spacing } = useResponsive();

  return (
    <>
      <TouchableOpacity
        style={[styles.disclaimerButton, style]}
        onPress={() => setShowDisclaimer(true)}
      >
        <Ionicons name="document-text-outline" size={18} color="#8b5cf6" />
        <Text style={[styles.disclaimerButtonText, { fontSize: fonts.sm }]}>
          Terms of Use
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#71717a" />
      </TouchableOpacity>
      <Disclaimer
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#171717',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionContent: {},
  paragraph: {
    color: '#d4d4d8',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#fff',
  },
  warningText: {
    color: '#fca5a5',
    lineHeight: 22,
  },
  bulletList: {},
  bulletItem: {
    color: '#d4d4d8',
    lineHeight: 24,
    marginBottom: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  footerText: {
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  acceptButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: '#27272a',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  acceptButtonTextDisabled: {
    color: '#71717a',
  },
  scrollHint: {
    color: '#71717a',
    textAlign: 'center',
    marginTop: 8,
  },
  closeButtonLarge: {
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disclaimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4c1d95',
    gap: 10,
  },
  disclaimerButtonText: {
    color: '#c4b5fd',
    flex: 1,
  },
});

export default Disclaimer;

