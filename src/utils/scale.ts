import {Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
export const BASE_WIDTH = 414;

export const scale = (size: number): number =>
  (SCREEN_WIDTH / BASE_WIDTH) * size;

export {SCREEN_WIDTH};
