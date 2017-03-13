const { bindActionCreators } = require('redux');
const { connect } = require('react-redux');
const { injectIntl } = require('react-intl');

const HistoryActions = require('../actions/HistoryActions');

const History = require('../components/sections/History');

const { getAvailableDevices, getDeviceCount, getMeterCount } = require('../utils/device');
const { prepareSessionsForTable, reduceMetric, sortSessions, meterSessionsToCSV, deviceSessionsToCSV, hasShowersBefore, hasShowersAfter } = require('../utils/sessions');
const timeUtil = require('../utils/time');
const { getMetricMu, formatMessage } = require('../utils/general');
const { getTimeLabelByGranularity } = require('../utils/chart');

const { meter: meterSessionSchema, amphiro: amphiroSessionSchema } = require('../schemas/history');

const { DEV_METRICS, METER_METRICS, DEV_PERIODS, METER_PERIODS, DEV_SORT, METER_SORT } = require('../constants/HomeConstants');

function mapStateToProps(state) {
  return {
    firstname: state.user.profile.firstname,
    devices: state.user.profile.devices,
    members: state.user.profile.household.members,
    ...state.section.history,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(HistoryActions, dispatch);
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const devType = stateProps.activeDeviceType;  
  const members = stateProps.members.filter(member => member.active);

  const sessions = sortSessions(prepareSessionsForTable(stateProps.devices, 
                                                        stateProps.data, 
                                                        members,
                                                        stateProps.firstname, 
                                                        stateProps.time.granularity,
                                                        ownProps.intl
                                                       ),
                                stateProps.sortFilter, 
                                stateProps.sortOrder
                               );

  const sessionFields = stateProps.activeDeviceType === 'METER' ? 
    meterSessionSchema
      :
    amphiroSessionSchema;
    
  const csvData = stateProps.activeDeviceType === 'METER' ? 
    meterSessionsToCSV(sessions) 
    : 
    deviceSessionsToCSV(sessions);

  let deviceTypes = [{
    id: 'METER', 
    title: 'Water meter', 
    image: 'water-meter.svg',
  }, {
    id: 'AMPHIRO', 
    title: 'Shower devices', 
    image: 'amphiro_small.svg',
  }];

  const amphiros = getAvailableDevices(stateProps.devices); 
  const meterCount = getMeterCount(stateProps.devices);
  const deviceCount = getDeviceCount(stateProps.devices);

  if (meterCount === 0) {
    deviceTypes = deviceTypes.filter(x => x.id !== 'METER');
  }
  
  if (deviceCount === 0) {
    deviceTypes = deviceTypes.filter(x => x.id !== 'AMPHIRO');
  }

  const metrics = devType === 'AMPHIRO' ? DEV_METRICS : METER_METRICS;

  //const periods = devType === 'AMPHIRO' ? DEV_PERIODS : METER_PERIODS;
  
  const sortOptions = devType === 'AMPHIRO' ? DEV_SORT : METER_SORT;

  const comparisons = stateProps.timeFilter !== 'custom' && devType !== 'AMPHIRO' ?
  [{
    id: 'last', 
    title: timeUtil.getComparisonPeriod(stateProps.time.startDate, 
                                        stateProps.time.granularity, 
                                        ownProps.intl
                                       ),
  }]
  : 
    [];

  const memberFilters = devType === 'AMPHIRO' ?
    [{
      id: 'all',
      title: 'All',
    },
    {
      id: 'default',
      title: stateProps.firstname,
    },
    ...members.map(member => ({
      id: member.index,
      title: member.name,
    })),
    ]
    :
      [];

  const reducedMetric = reduceMetric(stateProps.devices, stateProps.data, stateProps.filter);
  /*
  let info = null;
  if (stateProps.timeFilter === 'month' && stateProps.pricing) {
    if (reducedMetric < 9000) {
      info = 'You are in the lowest price bracket so far this month. ' +
        `There are ${9000 - reducedMetric} lt left to remain in the same category`;
    } else if (reducedMetric < 30000) { 
      info = 'You have reached the middle price bracket. ' +
        `There are ${30000 - reducedMetric} lt left to remain in the same category`;
    } else {
      info = 'This month\'s consumption so far is in the highest price bracket. ' +
        'Be careful next month!';
    }
    }
    */
  const AMPHIRO_MODES = [{ 
    id: 'stats', 
    title: 'Statistics',
    periods: DEV_PERIODS, 
  }];
  const METER_MODES = [{ 
    id: 'stats', 
    title: 'Statistics',
    periods: METER_PERIODS,
  },
  {
    id: 'forecasting',
    title: 'Forecasting',
    periods: METER_PERIODS.filter(p => p.id !== 'custom'),
  },
  {
    id: 'pricing',
    title: 'Pricing',
    periods: METER_PERIODS.filter(p => p.id === 'month'),
  },
  ];

  const modes = devType === 'AMPHIRO' ? AMPHIRO_MODES : METER_MODES;
  const periods = modes.find(m => m.id === stateProps.mode) ? modes.find(m => m.id === stateProps.mode).periods : [];

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nextPeriod: stateProps.time ? timeUtil.getNextPeriod(stateProps.timeFilter, 
                                                         stateProps.time.startDate
                                                        ) : {}, 
    previousPeriod: stateProps.time ? timeUtil.getPreviousPeriod(stateProps.timeFilter, 
                                                                 stateProps.time.endDate
                                                                ) : {},
    amphiros,
    periods,
    modes,
    metrics,
    comparisons,
    memberFilters,
    sortOptions,
    sessions,
    sessionFields,
    deviceTypes,
    csvData,
    //extraInfo: info,
    reducedMetric: `${reducedMetric} ${getMetricMu(stateProps.filter)}`,
    hasShowersAfter: () => hasShowersAfter(stateProps.showerIndex),
    hasShowersBefore: () => hasShowersBefore(stateProps.data),
    _t: formatMessage(ownProps.intl),
  };
}

const HistoryData = injectIntl(connect(mapStateToProps, 
                                       mapDispatchToProps, 
                                       mergeProps
                                      )(History));
module.exports = HistoryData;
