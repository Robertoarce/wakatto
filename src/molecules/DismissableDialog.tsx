import * as React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import DialogCloseButton from './DialogCloseButton';
import { RoundButton } from '../atoms';
import IconText from './IconText';
import { useResponsive } from '../constants/Layout';

interface Props {
  title: string;
  body: string;
  onPressOk: () => void;
  onRequestClose: () => void;
  buttonText?: string;
}

const DismissableDialog: React.FC<Props> = ({
  title,
  body,
  onPressOk,
  onRequestClose,
  buttonText = 'ok',
}: Props): JSX.Element => {
  const { fonts, spacing, borderRadius } = useResponsive();

  const dynamicStyles = React.useMemo(() => ({
    modal: {
      padding: spacing.xl,
    },
    container: {
      padding: spacing.xl,
      borderRadius: borderRadius.md,
    },
    titleContainer: {
      marginBottom: spacing.lg,
    },
    titleText: {
      fontSize: fonts.lg,
    },
    bodyContainer: {
      marginBottom: spacing.lg,
    },
    bodyText: {
      fontSize: fonts.sm,
    },
    checkList: {
      marginBottom: spacing.lg,
    },
  }), [fonts, spacing, borderRadius]);

  return (
    <View style={[styles.modal, dynamicStyles.modal]}>
      <View style={[styles.container, dynamicStyles.container]}>
        <DialogCloseButton onPress={onRequestClose} />
        <View style={styles.main}>
          <View style={[styles.titleContainer, dynamicStyles.titleContainer]}>
            <Text style={[styles.titleText, dynamicStyles.titleText]}>{title}</Text>
          </View>
          <View style={[styles.bodyContainer, dynamicStyles.bodyContainer]}>
            <Text style={[styles.bodyText, dynamicStyles.bodyText]}>{body}</Text>
          </View>
          <View style={[styles.checkList, dynamicStyles.checkList]}>
            <IconText icon="check" iconColor="#4080FD">
              Check 1
            </IconText>
            <IconText icon="check" iconColor="#4080FD">
              Check 2
            </IconText>
            <IconText icon="check" iconColor="#4080FD">
              Check 3
            </IconText>
          </View>
          <RoundButton color="#4080FD" label={buttonText} onPress={onPressOk} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    width: '100%',
  },
  main: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {},
  titleText: {},
  bodyContainer: {},
  bodyText: {
    color: 'gray',
  },
  checkList: {},
});

export default DismissableDialog;
