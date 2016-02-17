var userAPI = require('../api/user');
var types = require('../constants/ActionTypes');

var DeviceActions = require('./DeviceActions');
var getDefaultDevice = require('../utils/device').getDefaultDevice;

var UserActions = {
	_requestedLogin: function() {
		return {
			type:types.USER_REQUESTED_LOGIN,
			};
	},

	_receivedLogin: function(status, errors, profile) {
		return {
			type: types.USER_RECEIVED_LOGIN,
			status: status,
			errors: errors,
			profile: profile
		};
	},
	_requestedLogout: function() {
		return {
			type:types.USER_REQUESTED_LOGOUT,
			};
	},

	_receivedLogout: function(status, errors) {
		return {
			type: types.USER_RECEIVED_LOGOUT,
			status: status,
			errors: errors
		};
	},
	login: function(username, password) {
		return function(dispatch, getState) {
			dispatch(UserActions._requestedLogin());

			userAPI.login(username, password, function(response) {

				dispatch(UserActions._receivedLogin(response.success, response.errors, response.profile));
				//set default active device
				const defaultDevice = getDefaultDevice(response.profile.devices);
				if (defaultDevice) 
					dispatch(DeviceActions._setActiveDevice(defaultDevice.deviceKey));
			},
			function(error) {
				dispatch(UserActions._receivedLogin(false, error, {}));
			});
			
		};
	},
	refreshProfile: function() {
		return function(dispatch, getState) {
			userAPI.getProfile(function(response) {
				dispatch(UserActions._receivedLogin(response.success, response.errors, response.profile));

				//set default active device
				const defaultDevice = getDefaultDevice(response.profile.devices);
				if (defaultDevice) 
					dispatch(DeviceActions._setActiveDevice(defaultDevice.deviceKey));

			},
			function (error) {
				dispatch(UserActions._receivedLogin(false, error, {}));
			});
		};
	},
	logout: function() {
		return function(dispatch, getState) {
			dispatch(UserActions._requestedLogout());

			userAPI.logout(function(response) {
				dispatch(UserActions._receivedLogout(response.success, response.errors));
			},
			function(error) {
				dispatch(UserActions._receivedLogout(false, error));
			});
			
		};
	},

};


module.exports = UserActions;
