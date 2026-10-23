const appleKeyboard = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modifier = appleKeyboard ? '⌘' : 'Ctrl';

export const shortcuts = {
  run: {
    display: appleKeyboard ? '⇧⌘↵' : 'Ctrl Shift ↵',
    label: `${modifier} Shift Enter`,
    aria: `${appleKeyboard ? 'Meta' : 'Control'}+Shift+Enter`,
  },
  submit: {
    display: appleKeyboard ? '⌘↵' : 'Ctrl ↵',
    label: `${modifier} Enter`,
    aria: `${appleKeyboard ? 'Meta' : 'Control'}+Enter`,
  },
};
