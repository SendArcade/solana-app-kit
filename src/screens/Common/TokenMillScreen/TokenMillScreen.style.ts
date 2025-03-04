import {StyleSheet} from 'react-native';

export const tokenMillScreenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2a2a2a',
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});
