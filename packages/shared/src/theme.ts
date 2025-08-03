import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Style = ViewStyle | TextStyle | ImageStyle;

// Based on packages/shared/src/css/global.css
const globalStyles = {
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as Style,
  headerItem: {
    marginHorizontal: 15,
    color: '#000000',
    fontSize: 27, // 1.5em of a base font-size of 18
    fontWeight: 'bold',
    textDecorationLine: 'none',
  } as Style,
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    padding: 25,
    margin: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5, // for Android
    display: 'flex',
    flexDirection: 'column',
  } as Style,
  cardTitle: {
    fontSize: 22, // 1.2em of 18px
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    color: '#60a5fa',
    // center text
    textAlign: 'center',
  } as Style,

  cardContent: {
    lineHeight: 25, // 1.4 * 18px
    fontSize: '24px', // 1em of 18px
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  } as Style,
  list: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    margin: 20,
    padding: 0,
  } as Style,
  listItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  } as Style,
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  } as Style,
  flexContainer: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  } as Style,
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  } as Style,
  flexApp: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 128px)', // This is not directly translatable
    width: 1280, // This is not directly translatable
  } as Style,
  backArrow: {
    width: 36,
    height: 36,
  } as Style,
  backButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    zIndex: 1000,
  } as Style,
};

// Based on packages/shared/src/css/form.css
const formStyles = {
  inputField: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 25, // 1.4em
    shadowColor: '#000000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  } as Style,
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } as Style,
  buttonText: {
    color: '#000000',
    fontSize: 27, // 1.5em
    fontWeight: 'bold',
  } as Style,
  buttonTiny: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 5,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  } as Style,
  buttonTinyText: {
    fontSize: 14, // 0.8em
    fontWeight: 'bold',
  } as Style,
  buttonTinyEdit: {
    backgroundColor: '#f8f8f8',
  } as Style,
  buttonTinyDelete: {
    backgroundColor: '#fff0f0',
  } as Style,
  formGroup: {
    marginBottom: 20,
  } as Style,
  formGroupLabel: {
    marginBottom: 8,
    fontSize: 23, // 1.3em
    fontWeight: 'bold',
    color: '#000000',
  } as Style,
};

export const styles = {
  ...StyleSheet.create(globalStyles),
  ...StyleSheet.create(formStyles),
};
