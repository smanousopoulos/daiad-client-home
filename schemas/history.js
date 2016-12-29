const React = require('react');
const { IMAGES } = require('../constants/HomeConstants');

const meter = [
  {
    id: 'difference',
    name: 'Volume',
    value: (value, field, row) => 
      <span style={{ fontSize: '2.5em' }}>
        {value}
        <span style={{ fontSize: '0.6em' }}> lt</span>
      </span>,
  },
  {
    id: 'comparison',
    name: '',
    value: (value, field, row) => {
      if (row.percentDiff == null) {
        return <i className="dash" />;
      } else if (row.percentDiff < 0) {
        return <i className="fa fa-arrow-down green" />;
      }
      return <i className="fa fa-arrow-up red" />;
    },
  },
  {
    id: 'user',
    name: 'User',
    icon: 'user',
  },
  {
    id: 'date',
    name: 'Date',
    icon: 'calendar',
  },
  {
    id: 'showMore',
    name: ''
  }
];

const amphiro = [
  {
    id: 'volume',
    name: 'Volume',
    value: (value, field, row) => 
      <span style={{ fontSize: '2.5em' }}>
        {value}
        <span style={{ fontSize: '0.6em' }}> lt</span>
      </span>,
  },
  {
    id: 'comparison',
    name: '',
    value: (value, field, row) => {
      if (row.percentDiff == null) {
        return <i className="dash" />;
      } else if (row.percentDiff < 0) {
        return <i className="fa fa-arrow-down green" />;
      }
      return <i className="fa fa-arrow-up red" />;
    },
  },
  {
    id: 'user',
    name: 'User',
    icon: 'user',
  },
  {
    id: 'date',
    name: 'Date',
    icon: 'calendar',
  },
  {
    id: 'devName',
    name: 'Device',
  },
  {
    id: 'friendlyDuration',
    name: 'Dur',
    icon: 'clock-o',
  },
  {
    id: 'energyClass',
    name: 'En',
    icon: 'flash',
  },
  {
    id: 'temperature',
    name: 'Temp',
    icon: 'temperature',
    value: (value, field, row) => `${value} ºC`
  },
  {
    id: 'realtime',
    name: 'Real',
    value: (value, field, row) => row.history ? 
      <i className="fa fa-times" />
      :
      <i className="fa fa-check" />,
  },
  {
    id: 'id',
    name: 'Id',
    value: (value, field, row) => `#${value}`,
  },
  {
    id: 'showMore',
    name: '',
    value: (field, row) => 
    <img src={`${IMAGES}/arrow-big-right.svg`} alt="next" />,
  }
];

module.exports = {
  meter,
  amphiro,
};
