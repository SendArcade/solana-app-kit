import {StyleSheet, Dimensions} from 'react-native';
import COLORS from '../../../assets/colors';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smileFaceContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    left: SCREEN_WIDTH * 0.6,
    paddingVertical: 10,
    paddingHorizontal: 30,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 1,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    height: 45,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginVertical: 8,
  },
  buttonText: {
    marginLeft: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19.6,
    letterSpacing: -0.01,
    textAlign: 'center',
    color: COLORS.black,
  },
  agreementText: {
    position: 'absolute',
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
    bottom: 30,
  },
});

export default styles;
