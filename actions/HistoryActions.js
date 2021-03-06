/**
 * History Actions module.
 * Action creators for History section
 * 
 * @module HistoryActions
 */

const types = require('../constants/ActionTypes');
const moment = require('moment');
const { push } = require('react-router-redux');
const ReactGA = require('react-ga');
const { setForm } = require('./FormActions');

const { getDeviceKeysByType, getDeviceTypeByKey } = require('../utils/device');
const { getTimeByPeriod, getPreviousPeriod, getGranularityByDiff } = require('../utils/time');
const { getSessionById, getShowerRange, getLastShowerIdFromMultiple, hasShowersBefore, hasShowersAfter, isValidShowerIndex } = require('../utils/sessions');
const { showerFilterToLength } = require('../utils/general');

const QueryActions = require('./QueryActions');

const { PERIODS } = require('../constants/HomeConstants');

const setSessions = function (sessions) {
  return {
    type: types.HISTORY_SET_SESSIONS,
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

const enableEditShower = function () {
  return {
    type: types.HISTORY_SET_EDIT_SHOWER,
    enable: true,
  };
};

const disableEditShower = function () {
  return {
    type: types.HISTORY_SET_EDIT_SHOWER,
    enable: false,
  };
};

const onExportData = function () {
  ReactGA.event({
    category: 'history',
    action: 'download data',
  });
  return {
    type: types.HISTORY_EXPORT_DATA,
  };
};

const setMemberFilter = function (filter) {
  return {
    type: types.HISTORY_SET_MEMBER_FILTER,
    filter,
  };
};


/**
 * Sets comparison filter. Currently active only for deviceType METER
 *
 * @param {String} comparison - Comparison filter. One of: 
 * last (compare with user data from last period) 
 * @param {Bool} query=true - If true performs query based on active filters to update data
 */
const setComparisons = function (comparisons) {
  return {
    type: types.HISTORY_SET_COMPARISONS,
    comparisons,
  };
};

const resetComparisons = function () {
  return {
    type: types.HISTORY_CLEAR_COMPARISONS,
  };
};

const addComparison = function (id) {
  return {
    type: types.HISTORY_ADD_COMPARISON,
    id,
  };
};
const removeComparison = function (id) {
  return {
    type: types.HISTORY_REMOVE_COMPARISON,
    id,
  };
};

const setComparisonSessions = function (id, sessions) {
  return {
    type: types.HISTORY_SET_COMPARISON_SESSIONS,
    id,
    sessions,
  };
};

const setWaterIQSessions = function (sessions) {
  return {
    type: types.HISTORY_SET_WATERIQ_SESSIONS,
    sessions,
  };
};

const fetchComparison = function (id, query) {
  return function (dispatch, getState) {
    if (!Array.isArray(query.population) || query.population.length !== 1) {
      console.error('must provide only one population item for comparison');
      return Promise.reject();
    }
    return dispatch(QueryActions.queryDataAverage(query))
    .then(populations => Array.isArray(populations) && populations.length > 0 ? 
          populations[0] : [])
    .then(common => dispatch(setComparisonSessions(id, common)))
    .catch((error) => {
      console.error('caught error in fetch comparison', id, error);
      dispatch(QueryActions.setError(error));
    });
  };
};

const fetchComparisonData = function () {
  return function (dispatch, getState) {
    const { comparisons, activeDeviceType, activeDevice, timeFilter, showerIndex, time } = getState().section.history;
    const userKey = getState().user.profile.key;
    const utilityKey = getState().user.profile.utility.key;
    const commonKey = getState().section.settings.commons.favorite;

    return Promise.all(comparisons.map((comparison) => {
      if (comparison.id === 'last') {
        const prevTime = getPreviousPeriod(timeFilter, time.startDate);
        return dispatch(fetchComparison('last', {
          time: prevTime, 
          source: activeDeviceType,
          population: [{ 
            type: 'USER',
            users: [userKey],
          }],
        }));
      } else if (comparison.id === 'all') {
        return dispatch(fetchComparison('all', {
          time,
          source: activeDeviceType,
          population: [{ 
            type: 'UTILITY',
            utility: utilityKey,
          }],
        }));
      } else if (comparison.id === 'common') {
        return dispatch(fetchComparison('common', {
          time,
          source: activeDeviceType,
          population: [{ 
            type: 'GROUP',
            group: commonKey,
          }],
        }));
      } else if (comparison.id === 'nearest') {
        return dispatch(QueryActions.fetchUserComparison({
          comparison: 'nearest',
          time,
          userKey: getState().user.profile.key,
        }))
        .then(nearest => dispatch(setComparisonSessions('nearest', nearest)))
        .catch((error) => {
          console.error('caught error in fetch nearest user comparison', error);
          dispatch(QueryActions.setError(error));
        });
      } else if (comparison.id === 'similar') {
        return dispatch(QueryActions.fetchUserComparison({
          comparison: 'similar',
          time,
          userKey: getState().user.profile.key,
        }))
        .then(nearest => dispatch(setComparisonSessions('similar', nearest)))
        .catch((error) => {
          console.error('caught error in fetch similar user comparison', error);
          dispatch(QueryActions.setError(error));
        });
      } else if (activeDeviceType === 'AMPHIRO' && !isNaN(comparison.id)) {
        return dispatch(QueryActions.queryDeviceSessions({ 
          deviceKey: activeDevice, 
          length: showerFilterToLength(timeFilter),
          index: showerIndex,
          memberFilter: comparison.id,
        }))
        .then((sessions) => {
          dispatch(setComparisonSessions(comparison.id, sessions));
        })
        .catch((error) => {
          console.error('caught error in query comparison device sessions', comparison.id, error);
          dispatch(QueryActions.setError(error));
        }); 
      }
      return Promise.resolve();
    }));
  };
};

const fetchForecastData = function () {
  return function (dispatch, getState) {
    const { time } = getState().section.history;
    dispatch(QueryActions.queryMeterForecast({
      time,
      userKey: getState().user.profile.key,
    }))
    .then((sessions) => {
      const sortedByTime = sessions.sort((a, b) => {
        if (a.timestamp < b.timestamp) return -1;
        else if (a.timestamp > b.timestamp) return 1;
        return 0;
      });
      dispatch(setForecastData({ sessions: sortedByTime }));
    })
    .catch((error) => {
      dispatch(setForecastData({}));
      dispatch(QueryActions.setError(error));
      console.error('Caught error in history forecast query:', error);
    });
  };
};

const fetchWaterIQData = function () {
  return function (dispatch, getState) {
    const { time } = getState().section.history;
    return dispatch(QueryActions.fetchWaterIQ({
      time, 
      userKey: getState().user.profile.key,
    }))
    .then((waterIQData) => {
      dispatch(setWaterIQSessions(waterIQData));
    })
    .catch((error) => {
      dispatch(setWaterIQSessions([]));
      dispatch(QueryActions.setError(error));
      console.error('Caught error in history water iq query:', error);
    });
  };
};
/**
 * Performs query based on selected history section filters and saves data
 */

const fetchData = function () {
  const thunk = function (dispatch, getState) {
      const { showerIndex, activeDeviceType, activeDevice, timeFilter, time, data, memberFilter, synced } = getState().section.history;
    // AMPHIRO
    if (activeDeviceType === 'AMPHIRO') {
      if (activeDevice.length === 0) {
        dispatch(setSessions([]));
        dispatch(setDataSynced());
        return Promise.resolve();
      }

      return dispatch(QueryActions.queryDeviceSessions({ 
        deviceKey: activeDevice, 
        length: showerFilterToLength(timeFilter),
        index: showerIndex,
        memberFilter,
      }))
      .then((sessions) => {
        dispatch(setSessions(sessions));
      })
      .then(() => dispatch(fetchComparisonData()))
      .then(() => dispatch(setDataSynced()))
      .catch((error) => { 
        console.error('Caught error in history device query:', error); 
        dispatch(QueryActions.setError(error));
        dispatch(setSessions([]));
        dispatch(setDataSynced());
      });
      // SWM
    } else if (activeDeviceType === 'METER') {
      return dispatch(QueryActions.queryMeterHistory({
          time,
          userKey: getState().user.profile.key,
        }))
        .then((meterData) => {
          dispatch(setSessions(meterData));
          dispatch(setDataSynced());
        })
        .catch((error) => { 
          console.error('Caught error in history meter query:', error); 
        dispatch(QueryActions.setError(error));
          dispatch(setSessions([]));
          dispatch(setDataSynced());
        })
        .then(() => getState().section.history.mode === 'wateriq' ? dispatch(fetchWaterIQData()) : Promise.resolve())
        .then(() => getState().section.history.forecasting ? dispatch(fetchForecastData()) : Promise.resolve())
        .then(() => dispatch(fetchComparisonData()));
    }
    return Promise.resolve();
  };

  thunk.meta = {
    debounce: {
      time: 500,
      key: 'HISTORY_FETCH_DATA',
    },
  };
  return thunk;
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

const enablePricing = function () {
  return {
    type: types.HISTORY_SET_PRICING,
    enable: true,
  };
};

const disablePricing = function () {
  return {
    type: types.HISTORY_SET_PRICING,
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

const switchMemberFilter = function (filter) {
  return function (dispatch, getState) {
    dispatch(resetComparisons());
    dispatch(setShowerIndex(0));
    dispatch(setMemberFilter(filter));
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
    if (PERIODS.AMPHIRO.map(p => p.id).includes(filter)) {
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
  ReactGA.event({
    category: 'history',
    action: 'set sort filter',
    label: filter.toString(),
  });
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
  ReactGA.event({
    category: 'history',
    action: 'set sort order',
    label: order
  });
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

const setMode = function (mode) {
  return {
    type: types.HISTORY_SET_MODE,
    mode,
  };
};

const switchMode = function (mode) {
  return function (dispatch, getState) {
    dispatch(setMode(mode));
    dispatch(disableForecasting());
    dispatch(disablePricing());
    if (mode === 'pricing') {
      dispatch(enablePricing());
      dispatch(setSortOrder('asc'));
      dispatch(setSortFilter('timestamp'));
      dispatch(setMetricFilter('total'));
      if (getState().section.history.timeFilter !== 'month') {
        dispatch(setTimeFilter('month'));
        dispatch(setTime(getTimeByPeriod('month')));
      }
    } else if (mode === 'forecasting') {
      dispatch(setSortOrder('desc'));
      dispatch(enableForecasting());
      dispatch(setMetricFilter('volume'));
    } else if (mode === 'breakdown') {
      dispatch(setSortOrder('desc'));
      dispatch(setMetricFilter('volume'));
      getState().section.history.comparisons.forEach((c) => { 
        if (c.id !== 'last') {
          dispatch(removeComparison(c.id));
        }
      });
      dispatch(setSortFilter('volume'));
      if (getState().section.history.timeFilter === 'day' || getState().section.history.timeFilter === 'custom') {
        dispatch(setTimeFilter('month'));
        dispatch(setTime(getTimeByPeriod('month')));
      }
    } else if (mode === 'wateriq') {
      dispatch(setSortOrder('desc'));
      dispatch(setMetricFilter('volume'));
      dispatch(resetComparisons());
      dispatch(setTimeFilter('year'));
      dispatch(setTime(getTimeByPeriod('year')));
    } else if (mode === 'stats') {
      dispatch(setSortOrder('desc'));
      dispatch(setMetricFilter('volume'));
    }
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
    // TODO: reset with action to initial state
    if (deviceType === 'AMPHIRO') {
      dispatch(setMetricFilter('volume'));
      dispatch(switchMode('stats'));
      dispatch(setTimeFilter('ten'));
      dispatch(setSortFilter('id'));
      dispatch(setShowerIndex(0));
      dispatch(resetComparisons());
    } else if (deviceType === 'METER') {
      dispatch(setMetricFilter('volume'));
      dispatch(setTimeFilter('month'));
      dispatch(setTime(getTimeByPeriod('month')));
      dispatch(setSortFilter('timestamp'));
      dispatch(resetComparisons());
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
      
    return dispatch(QueryActions.fetchDeviceSession({ id, deviceKey }))
    .then((session) => { 
      dispatch(setSession({ ...session, deviceKey }));
      return session;
    })
    .catch((error) => {
      console.error('error fetching sesssion', error);
      dispatch(QueryActions.setError(error));
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
      dispatch(fetchDeviceSession(id, deviceKey))
      .then((session) => {
        if (session) {
          dispatch(setForm('shower', { time: session.timestamp }));
        }
      });
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
    const { active, showerId, device, deviceType, metric, sessionMetric, period, time, increaseShowerIndex: increaseIndex, decreaseShowerIndex: decreaseIndex, comparisons, clearComparisons, data, forecastData, comparisonData, waterIQData, memberFilter, mode } = query;

    dispatch(setDataUnsynced());

    if (mode) {
      ReactGA.modalview(mode);
      dispatch(switchMode(mode));
    }
    if (deviceType) {
      ReactGA.event({
        category: 'history',
        action: 'set device type',
        label: deviceType.toString(),
      });
      dispatch(switchActiveDeviceType(deviceType));
    }
    if (device) {
      ReactGA.event({
        category: 'history',
        action: 'set device',
      });
      dispatch(setActiveDevice(device));
    }
    if (metric) {
      ReactGA.event({
        category: 'history',
        action: 'set metric filter',
        label: metric.toString(),
      });
      dispatch(setMetricFilter(metric));
    }
    if (sessionMetric) {
      ReactGA.event({
        category: 'history',
        action: 'set session filter',
        label: sessionMetric.toString(),
      });
      dispatch(setSessionFilter(sessionMetric));
    }
    if (period) {
      ReactGA.event({
        category: 'history',
        action: 'set time filter',
        label: period.toString(),
      });
      dispatch(setTimeFilter(period));
    }
    if (time) {
      const timeFilter = period || getState().section.history.timeFilter;
      ReactGA.event({
        category: 'history',
        action: 'time change',
        label: `${timeFilter}: ${moment(time.startDate).format('DD/MM/YYYY')}-${moment(time.endDate).format('DD/MM/YYYY')}`,
      });
      dispatch(updateTime(time));
    }
    if (increaseIndex === true) {
      ReactGA.event({
        category: 'history',
        action: 'increase shower index',
      });
      dispatch(increaseShowerIndex());
    }
    if (decreaseIndex === true) {
      ReactGA.event({
        category: 'history',
        action: 'decrease shower index',
      });
      dispatch(decreaseShowerIndex());
    }

    if (memberFilter != null) {
      ReactGA.event({
        category: 'history',
        action: 'member filter',
        label: memberFilter.toString(),
      });
      dispatch(switchMemberFilter(memberFilter));
    }

    if (Array.isArray(comparisons)) {
      comparisons.forEach((comparison) => {
        if (getState().section.history.comparisons.find(c => c.id === comparison)) {
          ReactGA.event({
            category: 'history',
            action: 'remove comparison',
            label: comparison.toString(),
          });

          dispatch(removeComparison(comparison));
        } else if (comparison != null) {
          ReactGA.event({
            category: 'history',
            action: 'add comparison',
            label: comparison.toString(),
          });

          dispatch(addComparison(comparison));
        }
      });
    } else if (clearComparisons) {
      ReactGA.event({
        category: 'history',
        action: 'reset comparisons',
      });
      dispatch(resetComparisons());
    }

    
    if (Array.isArray(active) && active.length === 2 && active[0] != null && active[1] != null) { 
      //dispatch(setActiveSession(Array.isArray(device) ? device[0] : device, showerId)); 
      
      ReactGA.modalview(getState().section.history.activeDeviceType === 'AMPHIRO' ? 'shower' : 'meter-agg');
      ReactGA.event({
        category: 'history',
        action: 'set active session',
      });
      dispatch(setActiveSession(active[0], active[1])); 
    } else if (active === null) {
      dispatch(resetActiveSession());
    }
    if (comparisonData) {
      dispatch(setComparisons(comparisonData));
    }
    /*
    if (waterIQData) {
      dispatch(setWaterIQSessions(waterIQData));
    }
    if (forecastData) {
      dispatch(setForecastData(forecastData));
      }

    if (data && Array.isArray(data)) { 
      dispatch(setSessions(data));
      dispatch(setDataSynced());
      } 
    */
  };
};

const setQueryAndFetch = function (query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    dispatch(fetchData());
  };
};

const fetchAndSetQuery = function (query) {
  return function (dispatch, getState) {
    dispatch(fetchData())
    .then(() => dispatch(setQuery(query)));
  };
};

const linkToHistory = function (options) {
  return function (dispatch, getState) {
    dispatch(setQuery(options));
    dispatch(push('history'));
  };
};

const setPriceBrackets = function (brackets) {
  return {
    type: types.HISTORY_SET_PRICE_BRACKETS,
    brackets,
  };
};

const initPriceBrackets = function () {
  return function (dispatch, getState) {
    dispatch(QueryActions.fetchPriceBrackets())
    .then(brackets => Array.isArray(brackets) ? brackets.filter(bracket => bracket.maxVolume).map(bracket => ({
      ...bracket,
      // convert cubic meters to liters for consistency
      minVolume: bracket.minVolume * 1000,
      maxVolume: bracket.maxVolume * 1000,
    })) : [])
    .then(brackets => dispatch(setPriceBrackets(brackets)))
    .catch((error) => {
      console.error('caught error in init price brackets', error);
      dispatch(QueryActions.setError(error));
    });
  };
};

const setBreakdownLabels = function (labels) {
  return {
    type: types.HISTORY_SET_BREAKDOWN_LABELS,
    labels,
  };
};

const initWaterBreakdown = function () {
  return function (dispatch, getState) {
    dispatch(QueryActions.fetchWaterBreakdown())
    .then(labels => Array.isArray(labels) ? labels.reverse() : [])
    .then(labels => dispatch(setBreakdownLabels(labels)))
    .catch((error) => {
      console.error('caught error in init water breakdown', error);
      dispatch(QueryActions.setError(error));
    });
  };
};

module.exports = {
  linkToHistory,
  fetchDeviceSession,
  fetchData,
  setTime,
  updateTime,
  setComparisons,
  resetComparisons,
  //addComparison,
  //removeComparison,
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
  enablePricing,
  disablePricing,
  setQueryAndFetch,
  fetchAndSetQuery,
  enableEditShower,
  disableEditShower,
  setMemberFilter,
  setDataSynced,
  setDataUnsynced,
  initPriceBrackets,
  initWaterBreakdown,
  onExportData,
};
