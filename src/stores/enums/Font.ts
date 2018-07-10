import { Platform } from 'react-native';
import { types } from 'mobx-state-tree';

export const font = {
  System: 'System Default',
} as any;

if (Platform.OS === 'android') {
  font['Roboto'] = 'Roboto';
}

if (Platform.OS === 'ios') {
  font['San Francisco'] = 'San Fransisco';
}

export const formatFont = (key: string) => {
  return font[key];
};

export default types.enumeration('Font', Object.keys(font));
