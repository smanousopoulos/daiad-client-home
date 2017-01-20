/**
 * User Actions module.
 * User related action creators
 * 
 * @module UserActions
 */

const userAPI = require('../api/user');
const deviceAPI = require('../api/device');
const types = require('../constants/ActionTypes');

const InitActions = require('./InitActions');
const { resetSuccess } = require('./QueryActions');
const { SUCCESS_SHOW_TIMEOUT } = require('../constants/HomeConstants');
const { filterObj, throwServerError } = require('../utils/general');

const requestedLogin = function () {
  return {
    type: types.USER_REQUESTED_LOGIN,
  };
};

const receivedLogin = function (success, errors, profile) {
  return {
    type: types.USER_RECEIVED_LOGIN,
    success,
    errors,
    profile,
  };
};

const requestedLogout = function () {
  return {
    type: types.USER_REQUESTED_LOGOUT,
  };
};

const receivedLogout = function (success, errors) {
  return {
    type: types.USER_RECEIVED_LOGOUT,
    success,
    errors,
  };
};

const requestedQuery = function () {
  return {
    type: types.QUERY_REQUEST_START,
  };
};

const receivedQuery = function (success, errors) {
  return {
    type: types.QUERY_REQUEST_END,
    success,
    errors,
  };
};

const setCsrf = function (csrf) {
  return {
    type: types.USER_SESSION_SET_CSRF,
    csrf,
  };
};

/**
 * Action that is dispatched after authentication success
 * for optimization purposes 
 *
 * @return {Promise} Resolved or rejected promise with Object 
 * {success:true, profile{Object}} if resolved, {success: false} if rejected
 */
const letTheRightOneIn = function () {
  return {
    type: types.USER_LET_IN,
  };
};

/**
 * Fetches profile
 *
 * @return {Promise} Resolved or rejected promise with user profile if resolved, errors if rejected
 */
const fetchProfile = function () {
  return function (dispatch, getState) {
    return userAPI.getProfile()
    .then((response) => {
      const { success, errors, profile } = response;
      
      dispatch(receivedLogin(success, errors.length ? errors[0].code : null, profile));

      return response;
    })
    .catch((errors) => {
      console.error('Error caught on profile fetch:', errors);
      return errors;
    });
  };
};
/**
 * Performs user login 
 *
 * @param {String} username
 * @param {String} password
 * @return {Promise} Resolved or rejected promise with user profile if resolved, errors if rejected
 */
const login = function (username, password) {
  return function (dispatch, getState) {
    dispatch(requestedLogin());

    return userAPI.login(username, password)
    .then((response) => {
      const { csrf, success, errors, profile } = response;

      if (csrf) { dispatch(setCsrf(csrf)); }
      
      dispatch(receivedLogin(success, errors.length ? errors[0].code : null, profile));

      // Actions that need to be dispatched on login
      if (success) {
        return dispatch(InitActions.initHome(profile));
      }
      return Promise.reject(response);
    })
    .catch((errors) => {
      console.error('Error caught on user login:', errors);
      throw errors;
    });
  };
};

/**
 * Performs user logout 
 *
 * @return {Promise} Resolved or rejected promise, errors if rejected
 */
const logout = function () {
  return function (dispatch, getState) {
    dispatch(requestedLogout());

    const csrf = getState().user.csrf;

    return userAPI.logout({ csrf })
    .then((response) => {
      const { success, errors } = response;
    
      dispatch(receivedLogout(success, errors.length ? errors[0].code : null));

      return response;
    })
    .catch((errors) => {
      dispatch(receivedLogout(true, errors.length ? errors[0].code : null));
      console.error('Error caught on logout:', errors);
      return errors;
    });
  };
};

/**
 * Fetches profile and performs necessary initialization when user eefreshes page 
 *
 * @return {Promise} Resolved or rejected promise with user profile if resolved, errors if rejected
 */
const refreshProfile = function () {
  return function (dispatch, getState) {
    return dispatch(fetchProfile())
    .then((response) => {
      const { csrf, success, errors, profile } = response;
      
      if (csrf) { dispatch(setCsrf(csrf)); }

      dispatch(receivedLogin(success, errors.length ? errors[0].code : null, profile));

      if (success) {
        return dispatch(InitActions.initHome(profile));
        //  .then(() => dispatch(letTheRightOneIn()));
      } 

      return Promise.reject(response);
    })
    .catch((errors) => {
      console.error('Error caught on profile refresh:', errors);
      throw errors;
    });
  };
};
/**
 * Saves JSON data to profile  
 *
 * @param {Object} configuration - serializable object to be saved to user profile
 * @return {Promise} Resolved or rejected promise, with errors if rejected
 */
const saveToProfile = function (profile) {
  return function (dispatch, getState) {
    // TODO: country is there because of bug in backend 
    // that sets it to null otherwise causing problems
    const data = {
      country: 'Greece', 
      csrf: getState().user.csrf,
      ...profile, 
    };

    dispatch(requestedQuery());

    return userAPI.saveToProfile(data)
    .then((response) => {
      dispatch(receivedQuery(response.success, response.errors));
      setTimeout(() => { dispatch(resetSuccess()); }, SUCCESS_SHOW_TIMEOUT);

      if (!response || !response.success) {
        throwServerError(response);  
      }
      return response;
    }) 
    .catch((errors) => {
      console.error('Error caught on saveToProfile:', errors);
      dispatch(receivedQuery(false, errors));
      return errors;
    });
  };
};

const updateDevice = function (update) {
  return function (dispatch, getState) {
    const data = {
      csrf: getState().user.csrf,
      updates: [filterObj(update, [
        'name',
        'key',
        'type',
        'properties',
      ])], 
    };

    dispatch(requestedQuery());

    return deviceAPI.updateDevice(data)
    .then((response) => {
      dispatch(receivedQuery(response.success, response.errors));
      setTimeout(() => { dispatch(resetSuccess()); }, SUCCESS_SHOW_TIMEOUT);

      if (!response || !response.success) {
        throwServerError(response);  
      }
      return response;
    }) 
    .catch((errors) => {
      console.error('Error caught on updateDevice:', errors);
      dispatch(receivedQuery(false, errors));
      return errors;
    });
  };
};

module.exports = {
  login,
  logout,
  refreshProfile,
  fetchProfile,
  saveToProfile,
  updateDevice,
  letTheRightOneIn,
};
