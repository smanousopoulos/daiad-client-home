const React = require('react');
const { Chart, LineChart, BarChart } = require('react-echarts');
const lineTheme = require('../chart/themes/default');
const horizontalBarTheme = require('../chart/themes/horizontal-bar');
const verticalBarTheme = require('../chart/themes/vertical-bar');

const { IMAGES } = require('../../constants/HomeConstants');

function defaultFormatter(mu) {
  return function (y) {
    return `${y} ${mu}`;
  };
}

function StatWidget(props) {
  const { highlight, info = [], period, mu } = props;
  return (
    <div style={{ padding: 10 }}>
      <div style={{ float: 'left', width: '30%' }}>
        <div>
          { highlight && highlight.image ? 
            <img 
              style={{ 
                height: props.height, 
                maxHeight: 50, 
                float: 'left', 
              }} 
              src={`${IMAGES}/${highlight.image}`} 
              alt={highlight.image} 
            /> 
            :
            <i />
          }
          <h2>
            <span>{highlight.text}</span>
            <span style={{ fontSize: '0.5em', marginLeft: 5 }}>{highlight.mu}</span>
          </h2>
        </div>
      </div>
      <div style={{ float: 'left', width: '70%' }}>
        <div>
          { 
            info.map((line, idx) => (
              <div key={idx}>
                <i className={`fa fa-${line.icon}`} />
                { line.image ? <img style={{ maxHeight: 30, maxWidth: 30 }} src={`${IMAGES}/${line.image}`} alt={line.id} /> : <i /> }
                &nbsp;
                <span>{line.text}</span>
              </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

function LineChartWidget(props) {
  const { chartData = [], chartCategories, chartFormatter, chartColorFormatter, mu, width, height, legend } = props;
  const formatter = chartFormatter || defaultFormatter(mu);
  return (
    <LineChart
      height={height || 240}
      width={width} 
      theme={lineTheme}
      legend={legend}
      title=""
      subtitle="" 
      xAxis={{
        data: chartCategories,
        boundaryGap: true,
      }}
      yAxis={{
        min: 0,
        formatter,
      }}
      series={chartData.map(s => ({
        fill: 0.55,
        color: chartColorFormatter,
        ...s,
      }))}
    />
  );
}

function BarChartWidget(props) {
  const { chartData, chartCategories, chartFormatter, chartColorFormatter, mu, width, height, legend } = props;
  const formatter = chartFormatter || defaultFormatter(mu);
  return (
    <BarChart
      height={height || 240}
      width={width}
      theme={verticalBarTheme}
      legend={legend}
      xAxis={{
        data: chartCategories,
        boundaryGap: true,
      }}
      yAxis={{
        min: 0,
        formatter,
      }}
      series={chartData.map((s, idx) => ({ 
        ...s, 
        boundaryGap: true,
        color: chartColorFormatter,
        label: {
          position: 'top',
        } 
      }))}
    />
  );
}

function HorizontalBarChartWidget(props) {
  const { chartData, chartCategories, chartFormatter, chartColorFormatter, mu, width, height, legend } = props;
  const formatter = chartFormatter || defaultFormatter(mu);
  return (
    <BarChart
      height={height || 240}
      width={width}
      theme={horizontalBarTheme}
      legend={legend}
      horizontal
      xAxis={{
        data: chartCategories,
        boundaryGap: true,
      }}
      yAxis={{
        min: 0,
        formatter,
      }}
      series={chartData.map(s => ({ 
        ...s, 
        boundaryGap: true,
        color: chartColorFormatter,
        label: { 
          position: 'right',
        } 
      }))}
    />
  );
}

function ChartWidget(props) {
  const { chartType, ...rest } = props;
  return (
    <div>
      { 
        (() => {
          if (chartType === 'bar' || chartType === 'vertical-bar') {
            return (
              <BarChartWidget {...rest} />
            );
          } else if (chartType === 'horizontal-bar') {
            return (
              <HorizontalBarChartWidget {...rest} />
            );
          }
          return (
            <LineChartWidget {...rest} />
          );
        })()
      }
    </div>
  );
}

function DefaultWidgetByDisplay(props) {
  const { display } = props;
  if (display === 'stat') {
    return (
      <StatWidget {...props} /> 
    );
  } else if (display === 'chart') {
    return (
      <ChartWidget
        {...props} 
      /> 
    );
  } 
  return <div />;
}

function RankingWidget(props) {
  return (
    <div>
      <ChartWidget 
        {...props} 
        height={props.height - 30}
      />
      <div style={{ padding: '0 10px' }}>
      {
        props.info.map((line, idx) => (
          <div 
            key={idx} 
            style={{
              float: 'left', 
              width: (props.width - 20) / props.info.length, 
              textAlign: 'center' 
            }}
          >
          { 
            line.image ? 
              <img
                style={{ maxHeight: 30, maxWidth: 30 }} 
                src={`${IMAGES}/${line.image}`} 
                alt={line.id} 
              /> 
                : <i /> 
          }
            &nbsp;
            <span>{line.text}</span>
          </div>
          ))
      }
    </div>
    </div>
  );
}
function LastShowerWidget(props) {
  return (
    <div>
      <ChartWidget
        {...props}
        height={props.height - 50}
      />
      <div style={{ padding: '0 10px' }}>
        <div style={{ float: 'left', textAlign: 'center' }}>
          <img style={{ height: 40, width: 40, float: 'left' }} src={`${IMAGES}/${props.highlight.image}`} alt={props.highlight.image} /> 
          <h2 style={{ float: 'left' }}>
            <span>{props.highlight.text}</span>
            <span style={{ fontSize: '0.5em', marginLeft: 5 }}>{props.highlight.mu}</span>
          </h2>
        </div>
        {
        props.info.map((line, idx) => (
          <div 
            key={idx} 
            style={{
              float: 'left', 
              marginTop: 10,
              width: Math.max((props.width - 150) / props.info.length, 50),
              textAlign: 'center',
            }}
          >
          { 
            line.image ? 
              <img
                style={{ maxHeight: 30, maxWidth: 30 }} 
                src={`${IMAGES}/${line.image}`} 
                alt={line.id} 
              /> 
                : <i /> 
          }
            &nbsp;
            <span>{line.text}</span>
          </div>
          ))
      }
    </div>
  </div>
  );
}

function Widget(props) {
  const { type } = props;
  switch (type) {
    case 'ranking':
      return <RankingWidget {...props} />;
    case 'last':
      return <LastShowerWidget {...props} />;
    default:
      return <DefaultWidgetByDisplay {...props} />;
  }
}

module.exports = {
  StatWidget,
  ChartWidget,
  Widget,
};
