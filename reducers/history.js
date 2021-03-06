const types = require('../constants/ActionTypes');

const { updateOrAppendToSession } = require('../utils/sessions');
const { getMonth } = require('../utils/time');

const initialState = {
  filter: 'volume',
  timeFilter: 'month',
  time: getMonth(),
  sortFilter: 'timestamp',
  sortOrder: 'desc',
  activeDevice: [],
  activeDeviceType: 'METER',
  activeSessionFilter: 'volume',
  activeSession: null,
  synced: false,
  comparisons: [],
  data: [],
  showerIndex: 0,
  forecasting: false,
  pricing: false,
  forecastData: {
    sessions: []
  },
  editShower: false,
  memberFilter: 'all',
  mode: 'stats',
  priceBrackets: [],
  waterBreakdown: [],
  waterIQData: [],
};
 
const history = function (state = initialState, action) {
  switch (action.type) {
    case types.HISTORY_SET_SESSIONS:
      return Object.assign({}, state, {
        data: action.sessions
      });

    case types.HISTORY_SET_COMPARISONS:
      return Object.assign({}, state, {
        comparisons: action.comparisons
      });

    case types.HISTORY_CLEAR_COMPARISONS:
      return Object.assign({}, state, {
        comparisons: [], 
      });

    case types.HISTORY_ADD_COMPARISON: 
      return Object.assign({}, state, {
        comparisons: [...state.comparisons, { id: action.id, sessions: [] }],
      });

    case types.HISTORY_REMOVE_COMPARISON:
      return Object.assign({}, state, {
        comparisons: state.comparisons.filter(comparison => comparison.id !== action.id),
      });
  
    case types.HISTORY_SET_COMPARISON_SESSIONS:
      return Object.assign({}, state, {
        comparisons: state.comparisons.map(comparison => comparison.id === action.id ? { ...comparison, sessions: action.sessions } : comparison),
      });

    case types.HISTORY_SET_SESSION: {
      const updated = updateOrAppendToSession(state.data, action.session, action.session.id);
      return Object.assign({}, state, {
        data: updated
      });
    }

    case types.HISTORY_SET_DATA_SYNCED:
      return Object.assign({}, state, {
        synced: true
      });
    
    case types.HISTORY_SET_DATA_UNSYNCED:
      return Object.assign({}, state, {
        synced: false
      });

    case types.HISTORY_SET_TIME:
      return Object.assign({}, state, {
        time: Object.assign({}, state.time, action.time)
      });

    case types.HISTORY_SET_ACTIVE_DEVICE:
      return Object.assign({}, state, {
        activeDevice: action.deviceKey
      });

    case types.HISTORY_SET_ACTIVE_DEVICE_TYPE:
      return Object.assign({}, state, {
        activeDeviceType: action.deviceType
      });
    
    case types.HISTORY_SET_FILTER:
      return Object.assign({}, state, {
        filter: action.filter
      });
    
    case types.HISTORY_SET_TIME_FILTER:
      return Object.assign({}, state, {
        timeFilter: action.filter
      });

    case types.HISTORY_SET_SESSION_FILTER:
      return Object.assign({}, state, {
        activeSessionFilter: action.filter
      });

    
    case types.HISTORY_SET_ACTIVE_SESSION:
      return Object.assign({}, state, {
        activeSession: [action.device, action.id]
      });

    case types.HISTORY_RESET_ACTIVE_SESSION:
      return Object.assign({}, state, {
        activeSession: null
      });
   
    case types.HISTORY_SET_SORT_FILTER:
      return Object.assign({}, state, {
        sortFilter: action.filter
      });
    
    case types.HISTORY_SET_SORT_ORDER:
      return Object.assign({}, state, {
        sortOrder: action.order
      });

    case types.HISTORY_SET_SHOWER_INDEX:
      return Object.assign({}, state, {
        showerIndex: action.index,
      });

    case types.HISTORY_SET_FORECASTING:
      return Object.assign({}, state, {
        forecasting: action.enable,
      });

    case types.HISTORY_SET_PRICING:
      return Object.assign({}, state, {
        pricing: action.enable,
      });

    case types.HISTORY_SET_FORECAST_DATA:
      return Object.assign({}, state, {
        forecastData: action.data,
      });

    case types.HISTORY_SET_MEMBER_FILTER:
      return Object.assign({}, state, {
        memberFilter: action.filter,
      });

    case types.HISTORY_SET_EDIT_SHOWER:
      return Object.assign({}, state, {
        editShower: action.enable,
      });

    case types.HISTORY_SET_MODE:
      return Object.assign({}, state, {
        mode: action.mode,
      });

    case types.HISTORY_SET_PRICE_BRACKETS:
      return Object.assign({}, state, {
        priceBrackets: action.brackets,
      });

    case types.HISTORY_SET_BREAKDOWN_LABELS:
      return Object.assign({}, state, {
        waterBreakdown: action.labels,
      });

    case types.HISTORY_SET_WATERIQ_SESSIONS:
      return Object.assign({}, state, {
        waterIQData: action.sessions,
      });

    case types.USER_RECEIVED_LOGOUT:
      return Object.assign({}, initialState);

    default:
      return state;
  }
};

module.exports = history;

