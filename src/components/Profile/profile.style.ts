import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
    color: '#333',
  },
  optionButton: {
    width: '100%',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1d9bf0',
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export const confirmModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export const inlineConfirmStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export const editNameModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 15,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
