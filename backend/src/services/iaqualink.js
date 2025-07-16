import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class IaqualinkService {
  constructor() {
    this.apiBase = process.env.IAQUALINK_API_BASE || 'https://prod.zodiac-io.com';
    this.devicesUrl = process.env.IAQUALINK_DEVICES_URL || 'https://r-api.iaqualink.net/devices.json';
    this.sessionUrl = process.env.IAQUALINK_SESSION_URL || 'https://p-api.iaqualink.net/v1/mobile/session.json';

    this.username = process.env.IAQUALINK_USERNAME;
    this.password = process.env.IAQUALINK_PASSWORD;
    this.deviceId = process.env.IAQUALINK_DEVICE_ID;
    this.jetPumpCommand = process.env.JET_PUMP_COMMAND || 'aux_4';

    if (!process.env.JET_PUMP_COMMAND) {
      console.warn(
        'JET_PUMP_COMMAND not set - defaulting jet pump to aux_4. Set JET_PUMP_COMMAND in the .env file if jets use a different circuit.'
      );
    } else {
      console.log(`💧 Jet pump command mapped to ${this.jetPumpCommand}`);
    }

    this.sessionId = null;
    this.authToken = null;
    this.userId = null;
    this.devices = [];
    this.currentDevice = null;
    this.lastLogin = null;
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 43200000; // 12 hours

    if (!this.username || !this.password) {
      throw new Error('IAQUALINK_USERNAME and IAQUALINK_PASSWORD must be set in environment variables');
    }
  }

  async login() {
    try {
      const response = await axios.post(`${this.apiBase}/users/v1/login`, {
        api_key: 'EOOEMOW4YR6QNB07', // Standard API key for iAqualink
        email: this.username,
        password: this.password
      });

      const data = response.data;
      this.authToken = data.authentication_token;
      this.userId = data.id;
      this.sessionId = data.session_id;
      this.lastLogin = Date.now();

      console.log('✅ Successfully logged in to iAqualink');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with iAqualink');
    }
  }

  async getDevices() {
    try {
      const response = await axios.get(this.devicesUrl, {
        params: {
          api_key: 'EOOEMOW4YR6QNB07',
          authentication_token: this.authToken,
          user_id: this.userId
        }
      });

      this.devices = response.data || [];

      // Select device - use specified device ID or first available
      if (this.deviceId) {
        this.currentDevice = this.devices.find(device => device.serial_number === this.deviceId);
        if (!this.currentDevice) {
          throw new Error(`Device with serial ${this.deviceId} not found`);
        }
      } else {
        this.currentDevice = this.devices[0];
      }

      if (!this.currentDevice) {
        throw new Error('No devices found in account');
      }

      console.log(`📱 Using device: ${this.currentDevice.name} (${this.currentDevice.serial_number})`);
      return this.devices;
    } catch (error) {
      console.error('❌ Failed to get devices:', error.response?.data || error.message);
      throw new Error('Failed to retrieve devices');
    }
  }

  async ensureAuthenticated() {
    const now = Date.now();

    // Check if we need to login or refresh session
    if (!this.authToken || !this.sessionId || 
        (this.lastLogin && (now - this.lastLogin) > this.sessionTimeout)) {
      await this.login();
      await this.getDevices();
    }
  }

  async getSpaStatus() {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get(this.sessionUrl, {
        params: {
          actionID: 'command',
          command: 'get_home',
          serial: this.currentDevice.serial_number,
          sessionID: this.sessionId
        }
      });

      const data = response.data;
      const flatStatus = data.home_screen.reduce((acc, item) => ({ ...acc, ...item }), {});

      const auxKeys = Object.keys(flatStatus).filter(k => k.startsWith('aux'));
      console.log('🧩 Detected AUX keys:', auxKeys);
      auxKeys.forEach(key => {
        console.log(`  ${key}:`, flatStatus[key]);
      });

      const jetPumpStatus = auxKeys.includes(this.jetPumpCommand) 
        ? flatStatus[this.jetPumpCommand] === '1' 
        : false;

      const status = {
        airTemp: parseInt(flatStatus.air_temp, 10) || null,
        spaTemp: parseInt(flatStatus.spa_temp || flatStatus.spa_set_point, 10) || null,
        poolTemp: parseInt(flatStatus.pool_temp || flatStatus.pool_set_point, 10) || null,
        spaSetPoint: parseInt(flatStatus.spa_set_point, 10) || null,
        spaMode: flatStatus.spa_pump === '1',
        spaHeater: flatStatus.spa_heater === '3',
        jetPump: jetPumpStatus,
        filterPump: flatStatus.pool_pump === '1', // Add filter pump status
        connected: flatStatus.status === 'Online',
        lastUpdate: new Date().toISOString()
      };

      console.log('✅ Mapped Spa Status:', status);
      return status;

    } catch (error) {
      console.error('❌ Failed to get spa status:', error.response?.data || error.message);
      throw new Error('Failed to retrieve spa status');
    }
  }

  async toggleDevice(deviceName) {
    await this.ensureAuthenticated();

    const deviceMap = {
      'spa-mode': 'spa_pump',
      'spa-heater': 'spa_heater',
      'jet-pump': this.jetPumpCommand,
      'filter-pump': 'pool_pump' // Add filter pump control
    };

    const command = deviceMap[deviceName];
    if (!command) {
      throw new Error(`Unknown device: ${deviceName}`);
    }

    try {
      const response = await axios.get(this.sessionUrl, {
        params: {
          actionID: 'command',
          command: 'set_' + command,
          serial: this.currentDevice.serial_number,
          sessionID: this.sessionId
        }
      });

      console.log(`🔄 Toggled ${deviceName} successfully`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to toggle ${deviceName}:`, error.response?.data || error.message);
      throw new Error(`Failed to toggle ${deviceName}`);
    }
  }

  async setSpaTemperature(temperature) {
    await this.ensureAuthenticated();

    try {
      const response = await axios.get(this.sessionUrl, {
        params: {
          actionID: 'command',
          command: 'set_spa_set_point',
          serial: this.currentDevice.serial_number,
          sessionID: this.sessionId,
          temp: temperature
        }
      });

      console.log(`🌡️ Set spa temperature to ${temperature}°F successfully`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to set spa temperature:`, error.response?.data || error.message);
      throw new Error('Failed to set spa temperature');
    }
  }
}

export default new IaqualinkService();
