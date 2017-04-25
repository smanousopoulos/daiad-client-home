const React = require('react');
const { FormattedMessage } = require('react-intl');

/* Be Polite, greet user */
function SayHello(props) {
  return (
    <div style={{ margin: '40px 30px 20px 30px' }}>
      <h3>
        <FormattedMessage 
          id="dashboard.hello" 
          values={{ name: props.firstname }} 
        />
      </h3>
    </div>
  );
}

module.exports = SayHello;
