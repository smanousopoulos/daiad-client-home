/**
 * History Actions module.
 * Action creators for History section
 * 
 * @module HistoryActions
 */

const types = require('../constants/ActionTypes');
const { push } = require('react-router-redux');
const { getDeviceKeysByType, getDeviceTypeByKey } = require('../utils/device');
const { getTimeByPeriod, getPreviousPeriod, getGranularityByDiff } = require('../utils/time');
const { getSessionById, getShowerRange, getLastShowerIdFromMultiple, hasShowersBefore, hasShowersAfter, isValidShowerIndex } = require('../utils/sessions');
const { showerFilterToLength, getCacheKey } = require('../utils/general');

const QueryActions = require('./QueryActions');

const { DEV_PERIODS } = require('../constants/HomeConstants');

const setSessions = function (sessions) {
  return {
    type: types.HISTORY_SET_SESSIONS,
    sessions,
  };
};

const setComparisonSessions = function (sessions) {
  return {
    type: types.HISTORY_SET_COMPARISON_SESSIONS,
    sessions,
  };
};

const setSession = function (session) {
  return {
    type: types.HISTORY_SET_SESSION,
    session,
  };
};

const setDataSynced = function () {
  return {
    type: types.HISTORY_SET_DATA_SYNCED,
  };
};

const setDataUnsynced = function () {
  return {
    type: types.HISTORY_SET_DATA_UNSYNCED,
  };
};

const setForecastData = function (data) {
  return {
    type: types.HISTORY_SET_FORECAST_DATA,
    data,
  };
};

/**
 * Performs query based on selected history section filters and saves data
 */
const fetchData = function () {
  return function (dispatch, getState) {
      const { showerIndex, activeDeviceType, activeDevice, timeFilter, time, data } = getState().section.history;
    // AMPHIRO
    if (activeDeviceType === 'AMPHIRO') {
      if (activeDevice.length === 0) {
        dispatch(setSessions([]));
        dispatch(setDataSynced());
        return;
      }
      
      dispatch(QueryActions.queryDeviceSessionsCache({ 
        deviceKey: activeDevice, 
        length: showerFilterToLength(timeFilter),
        index: showerIndex,
      }))
      .then((sessions) => {
        dispatch(setSessions(sessions));
      })
      .then(() => dispatch(setDataSynced()))
      .catch((error) => { 
        console.error('Caught error in history device query:', error); 
        dispatch(setSessions([]));
        dispatch(setDataSynced());
      });
      // SWM
    } else if (activeDeviceType === 'METER') {
      dispatch(QueryActions.queryMeterHistoryCache({
        deviceKey: activeDevice, 
        time, 
      }))
      .then((sessions) => {
        dispatch(setSessions(sessions));
      })
      .then(() => dispatch(setDataSynced()))
      .catch((error) => { 
        console.error('Caught error in history meter query:', error); 
        dispatch(setSessions([]));
        dispatch(setDataSynced());
      });

      // comparisons
      if (getState().section.history.comparison === 'last') {
        dispatch(QueryActions.queryMeterHistoryCache({
          deviceKey: getState().section.history.activeDevice, 
          time: getPreviousPeriod(getState().section.history.timeFilter, 
                                  getState().section.history.time.startDate
                                 ), 
        }))
        .then(sessions => dispatch(setComparisonSessions(sessions)))
      .catch((error) => { 
        dispatch(setComparisonSessions([]));
        console.error('Caught error in history comparison query:', error); 
      });
      } else {
        dispatch(setComparisonSessions([]));
      }

      // forecasting
      if (getState().section.history.forecasting) {
        dispatch(QueryActions.queryMeterForecast({
          time: getState().section.history.time,
        }))
        .then((sessions) => {
          const sortedByTime = sessions.sort((a, b) => {
            if (a.timestamp < b.timestamp) return -1;
            else if (a.timestamp > b.timestamp) return 1;
            return 0;
          });
          dispatch(setForecastData(sortedByTime));
        })
        .catch((error) => {
          dispatch(setForecastData([]));
          console.error('Caught error in history forecast query:', error);
        });
      }
    }
  };
};

const enableForecasting = function () {
  return {
    type: types.HISTORY_SET_FORECASTING,
    enable: true,
  };
};

const disableForecasting = function () {
  return {
    type: types.HISTORY_SET_FORECASTING,
    enable: false,
  };
};

/**
 * Resets active session to null. 
 */
const resetActiveSession = function () {
  return {
    type: types.HISTORY_RESET_ACTIVE_SESSION,
  };
};

/**
 * Sets metric filter for history section. 
 *
 * @param {String} filter - metric filter 
 */
const setMetricFilter = function (filter) {
  return {
    type: types.HISTORY_SET_FILTER,
    filter,
  };
};

const setShowerIndex = function (index) {
  return {
    type: types.HISTORY_SET_SHOWER_INDEX,
    index,
  };
};

/**
 * Sets time/period filter for history section. 
 *
 * @param {String} filter - time/period filter 
 */
const setTimeFilter = function (filter) {
  return function (dispatch, getState) {
    dispatch({
      type: types.HISTORY_SET_TIME_FILTER,
      filter,
    });
    if (DEV_PERIODS.map(p => p.id).includes(filter)) {
      dispatch(setShowerIndex(0));
    }
  };
};

/**
 * Sets session metric filter for active session in history section. 
 *
 * @param {String} filter - session metric filter 
 */
const setSessionFilter = function (filter) {
  return {
    type: types.HISTORY_SET_SESSION_FILTER,
    filter,
  };
};

 /**
 * Sets sort filter for sessions list in history section. 
 *
 * @param {String} filter - session list sort filter 
 */
const setSortFilter = function (filter) {
  return {
    type: types.HISTORY_SET_SORT_FILTER,
    filter,
  };
};

 /**
 * Sets sort order for sessions list in history section. 
 *
 * @param {String} order - session list order. One of asc, desc 
 */
const setSortOrder = function (order) {
  if (order !== 'asc' && order !== 'desc') throw new Error('order must be asc or desc');
  return {
    type: types.HISTORY_SET_SORT_ORDER,
    order,
  };
};

/**
 * Sets active devices. 
 *
 * @param {Array} deviceKey - Device keys to set active. 
 *  Important: Device keys must only be of one deviceType (METER or AMPHIRO)  
 * @param {Bool} query=true - If true performs query based on active filters to update data
 */
const setActiveDevice = function (deviceKey) {
  return {
    type: types.HISTORY_SET_ACTIVE_DEVICE,
    deviceKey: Array.isArray(deviceKey) ? deviceKey : [deviceKey],
  };
};

/**
 * Sets active time window in history section
 *
 * @param {Object} time - Active time window
 * @param {Number} time.startDate - Start timestamp 
 * @param {Number} time.endDate - End timestamp
 * @param {Number} time.granularity - Granularity for data aggregation. 
 * One of 0: minute, 1: hour, 2: day, 3: week, 4: month
 * @param {Bool} query=true - If true performs query based on active filters to update data
 */
const setTime = function (time) {
  return {
    type: types.HISTORY_SET_TIME,
    time,
  };
};

const setActiveDeviceType = function (deviceType) {
  return {
    type: types.HISTORY_SET_ACTIVE_DEVICE_TYPE,
    deviceType,
  };
};

/**
 * Sets active device type. 
 * All available devices of selected type are activated 
 * and default values are provided for deviceType dependent filters
 *
 * @param {Array} deviceType - Active device type. One of AMPHIRO, METER  
 * @param {Bool} query=true - If true performs query based on active filters to update data
 */
const switchActiveDeviceType = function (deviceType) {
  return function (dispatch, getState) {
    dispatch(setActiveDeviceType(deviceType));
    const devices = getDeviceKeysByType(getState().user.profile.devices, deviceType);
    dispatch(setActiveDevice(devices, false));
    
    // set default options when switching
    if (deviceType === 'AMPHIRO') {
      dispatch(setMetricFilter('volume'));
      dispatch(setTimeFilter('ten'));
      dispatch(setSortFilter('id'));
      dispatch(setShowerIndex(0));
    } else if (deviceType === 'METER') {
      dispatch(setMetricFilter('difference'));
      dispatch(setTimeFilter('year'));
      dispatch(setTime(getTimeByPeriod('year')));
      dispatch(setSortFilter('timestamp'));
    }
  };
};

/**
 * Fetches device session (uniquely defined by deviceKey, id) and updates history data
 *
 * @param {Number} id - Session id to fetch 
 * @param {String} deviceKey - Device key session id corresponds to
 * @return {Promise} Resolved or rejected promise with session data if resolved, errors if rejected
 */
const fetchDeviceSession = function (id, deviceKey) {
  return function (dispatch, getState) {
    const devFound = getState().section.history.data
    .find(d => d.deviceKey === deviceKey);

    const sessions = devFound ? devFound.sessions : [];
    const found = getSessionById(sessions, id); 
    
    if (found && found.measurements) {
      return Promise.resolve();
    }
    return dispatch(QueryActions.fetchDeviceSession(id, deviceKey))
    .then((session) => { 
      dispatch(setSession({ ...session, deviceKey }));
      return session;
    })
    .catch((error) => {
      console.error('error fetching sesssion', error);
    });
  };
};

/**
 * Sets active session by either deviceKey & id, or by timestamp. 
 * Device key and id are provided for unique sessions (for deviceType AMPHIRO)
 * Timestamp is used as unique identifier for aggragated sessions (for deviceType METER)
 *
 * @param {String} deviceKey - device key for unique session
 * @param {Number} id - id for unique session
 * @param {Number} timestamp - timestamp for aggragated session
 */
const setActiveSession = function (deviceKey, id, timestamp) {
  return function (dispatch, getState) {
    dispatch({
      type: types.HISTORY_SET_ACTIVE_SESSION,
      device: deviceKey,
      id: id || timestamp,
    });
    if (id != null && deviceKey != null) {
      dispatch(fetchDeviceSession(id, deviceKey, getState().section.history.time));
    }
  };
};

/**
 * Updates active time window in history section
 * Same as setTime, only without providing granularity 
 * which is computed based on difference between startDate, endDate
 * See {@link setTime}
 */
const updateTime = function (time) {
  return function (dispatch, getState) {
    const stateTime = getState().section.history.time;
    const { 
      startDate = stateTime.startDate, 
      endDate = stateTime.endDate, 
        granularity = getGranularityByDiff(startDate, endDate) 
    } = time;

    dispatch(setTime({ startDate, endDate, granularity }));
  };
};

/**
 * Sets comparison filter. Currently active only for deviceType METER
 *
 * @param {String} comparison - Comparison filter. One of: 
 * last (compare with user data from last period) 
 * @param {Bool} query=true - If true performs query based on active filters to update data
 */
const setComparison = function (comparison) {
  return {
    type: types.HISTORY_SET_COMPARISON,
    comparison,
  };
    //if (comparison == null) dispatch(setComparisonSessions([]));
};

const increaseShowerIndex = function () {
  return function (dispatch, getState) {
    const index = getState().section.history.showerIndex;
    if (hasShowersAfter(index)) {
      dispatch(setShowerIndex(index + 1));
    }
  };
};

const decreaseShowerIndex = function () {
  return function (dispatch, getState) {
    const index = getState().section.history.showerIndex;
    if (hasShowersBefore(getState().section.history.data)) { 
      dispatch(setShowerIndex(index - 1));
    }
  };
};

/**
 * Updates all history options provided
 *
 * TODO: needs update
 *
 * @param {Object} options - Contains all needed options for history
 * @param {String} options.deviceType - Active device type. One of AMPHIRO, METER
 * @param {Array} options.device - Array of device keys to limit active devices 
 * (if not provided all devices are active)
 * @param {String} options.metric - Active metric filter. If METER difference, 
 * if AMPHIRO volume, energy, temperature, duration
 * @param {String} options.period - Active period.
 * For METER one of day, week, month, year, custom (time-based),
 * for AMPHIRO one of ten, twenty, fifty (index-based)
 * @param {Object} options.time - Active time window
 * @param {Number} options.time.startDate - Start timestamp 
 * @param {Number} options.time.endDate - End timestamp
 * @param {Number} options.time.granularity - Granularity for data aggregation. 
 * One of 0: minute, 1: hour, 2: day, 3: week, 4: month
 * @param {Number} options.showerId - The active session id. Together with device indicates 
 * unique session to set active (device array must only have one entry)
 * @param {Object} options.data - If provided data will be copied to history section. 
 * Used to avoid extra fetch
 */
const setQuery = function (query) {
  return function (dispatch, getState) {
    const { showerId, device, deviceType, metric, sessionMetric, period, time, increaseShowerIndex: increaseIndex, decreaseShowerIndex: decreaseIndex, forecasting, comparison, data, forecastData } = query;

    dispatch(setDataUnsynced());

    if (deviceType) dispatch(switchActiveDeviceType(deviceType));
    if (device) dispatch(setActiveDevice(device));
    if (metric) dispatch(setMetricFilter(metric));
    if (sessionMetric) dispatch(setSessionFilter(sessionMetric));
    if (period) dispatch(setTimeFilter(period));
    if (time) dispatch(updateTime(time));
    if (increaseIndex === true) dispatch(increaseShowerIndex());
    if (decreaseIndex === true) dispatch(decreaseShowerIndex());
    
    if (forecasting === true) dispatch(enableForecasting());
    else if (forecasting === false) dispatch(disableForecasting());

    if (comparison) dispatch(setComparison(comparison));
    else if (comparison === null) dispatch(setComparison(null));

    if (device != null && showerId != null) { 
      dispatch(setActiveSession(Array.isArray(device) ? device[0] : device, showerId)); 
    } 

    if (forecastData && Array.isArray(forecastData)) {
      dispatch(setForecastData(forecastData));
    }

    if (data && Array.isArray(data)) { 
      dispatch(setSessions(data));
      dispatch(setDataSynced());
    }    
  };
};
const setQueryAndFetch = function (query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    dispatch(fetchData());
  };
};

const linkToHistory = function (options) {
  return function (dispatch, getState) {
    dispatch(setQuery(options));
    dispatch(push('/history'));
  };
};

module.exports = {
  linkToHistory,
  fetchDeviceSession,
  fetchData,
  setTime,
  updateTime,
  setComparison,
  setActiveDevice,
  switchActiveDeviceType,
  setActiveSession,
  resetActiveSession,
  setMetricFilter,
  setTimeFilter,
  setSessionFilter,
  setSortFilter,
  setSortOrder,
  setShowerIndex,
  increaseShowerIndex,
  decreaseShowerIndex,
  enableForecasting,
  disableForecasting,
  setQueryAndFetch,
};
