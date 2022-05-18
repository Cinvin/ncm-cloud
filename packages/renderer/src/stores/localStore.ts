const Store = require('electron-store');
// https://github.com/sindresorhus/electron-store
Store.initRenderer()
const schema = {
  NCMCookie: {
    type: 'string',
    default: '',
  },
};

const store = new Store(schema);

export { store }