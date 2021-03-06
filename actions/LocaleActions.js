/**
 * Locale Actions module.
 * I18N related action creators
 * 
 * @module LocaleActions
 */

const ReactGA = require('react-ga');
const localeAPI = require('../api/locales');
const types = require('../constants/ActionTypes');

const { requestedQuery, receivedQuery, setError } = require('./QueryActions');

const { flattenMessages } = require('../utils/general');

const setCsrf = function (csrf) {
  return {
    type: types.USER_SESSION_SET_CSRF,
    csrf,
  };
};

const receivedMessages = function (locale, messages) {
  return {
    type: types.LOCALE_RECEIVED_MESSAGES,
    locale,
    messages,
  };
};

/**
 * Fetches locale strings
 *
 * @param {String} locale - One of en, el, es, de, fr
 * @return {Promise} Resolved or rejected promise 
 * with locale strings if resolved, errors if rejected
 */
const fetchLocaleMessages = function (locale) {
  return function (dispatch, getState) {
    dispatch(requestedQuery());

    return localeAPI.fetchLocaleMessages({ locale })
    .then((response) => {
      dispatch(receivedQuery());

      const messages = { ...response };
      const { csrf } = messages;
      delete messages.csrf;
      
      if (csrf) { dispatch(setCsrf(csrf)); }

      dispatch(receivedMessages(locale, flattenMessages(messages)));
      return messages;
    })
    .catch((errors) => {
      console.error('caught error on locale fetch', errors);
      dispatch(setError(errors));
    });
  };
};

/**
 * Sets locale and fetches locale strings
 *
 * @param {String} locale - One of en, el, es, de, fr 
 * @return {Promise} Resolved or rejected promise 
 * with locale strings if resolved, errors if rejected
 */
const setLocale = function (locale) {
  return function (dispatch, getState) {
    if (getState().locale.locale === locale) {
      return Promise.resolve(true);
    }
    ReactGA.event({
      category: 'locale',
      action: 'changed',
      label: locale.toString(),
    });
    return dispatch(fetchLocaleMessages(locale));
  };
};

module.exports = {
  fetchLocaleMessages,
  setLocale,
};
