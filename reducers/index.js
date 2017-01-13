const { combineReducers } = require('redux');
const { routerReducer } = require('react-router-redux');

const locale = require('./locale');
const user = require('./user');
const query = require('./query');
const history = require('./history');
const dashboard = require('./dashboard');
const messages = require('./messages');
const forms = require('./forms');
const viewport = require('./viewport');

const rootReducer = combineReducers({
  routing: routerReducer,
  locale,
  user,
  query,
  forms,
  viewport,
  section: combineReducers({
    history,
    dashboard,
    messages,
  }),
});

module.exports = rootReducer;