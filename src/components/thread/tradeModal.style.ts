// FILE: tradeModal.style.ts
import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  tabButtonActive: {
    backgroundColor: '#1d9bf0',
  },
  tabButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  tokenRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  tokenColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '35%',
  },
  arrowContainer: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenSelector: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  tokenSelectorText: {
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  swapButton: {
    marginTop: 16,
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  swapButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#aaa',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  resultText: {
    marginTop: 16,
    fontSize: 14,
    color: 'green',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
});
