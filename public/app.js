// Simplified iAquaLink Spa Control - Main Application Logic
// Only handles spa mode, spa heat, filter pump, and temperature

class SimpleSpaController {
    constructor() {
        this.apiKey = 'EOOEMOW4YR6QNB07';
        this.auth = null;
        this.selectedSystem = null;
        this.devices = [];
        this.updateInterval = null;
        this.isUpdating = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.showScreen('login');
        this.tryAutoLogin();
    }

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout buttons
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('logout-error-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Temperature controls
        document.getElementById('temp-up').addEventListener('click', () => {
            this.adjustTemperature(1);
        });

        document.getElementById('temp-down').addEventListener('click', () => {
            this.adjustTemperature(-1);
        });

        // Spa control buttons
        document.getElementById('spa-mode-control').addEventListener('click', () => {
            this.toggleSpaMode();
        });

        document.getElementById('spa-heat-control').addEventListener('click', () => {
            this.toggleSpaHeat();
        });

        document.getElementById('filter-pump-control').addEventListener('click', () => {
            this.toggleFilterPump();
        });

        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.loadDevices();
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById(`${screenName}-screen`).style.display = 'flex';
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');

        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        document.querySelector('.btn-text').style.display = 'none';
        document.querySelector('.btn-loading').style.display = 'inline';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store authentication
            this.auth = {
                authentication_token: data.authentication_token,
                user_id: data.user_id,
                session_id: data.session_id
            };

            // Save to sessionStorage for persistence
            sessionStorage.setItem('spa_auth', JSON.stringify(this.auth));

            // Load devices
            this.showScreen('loading');
            await this.loadDevices();

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Failed to login. Please check your credentials.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            document.querySelector('.btn-text').style.display = 'inline';
            document.querySelector('.btn-loading').style.display = 'none';
        }
    }

    async loadDevices() {
        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_devices',
                    api_key: this.apiKey,
                    authentication_token: this.auth.authentication_token,
                    user_id: this.auth.user_id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load devices');
            }

            if (!data || data.length === 0) {
                throw new Error('No pool systems found');
            }

            // Use the first system
            this.selectedSystem = data[0];

            // Load session data for the system
            await this.loadSessionData();

        } catch (error) {
            console.error('Load devices error:', error);
            this.showErrorScreen(error.message || 'Failed to load spa devices');
        }
    }

    async loadSessionData() {
        try {
            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_session',
                    api_key: this.apiKey,
                    authentication_token: this.auth.authentication_token,
                    user_id: this.auth.user_id,
                    serial: this.selectedSystem.serial_number
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load session data');
            }

            // Store filtered devices
            this.devices = data.home_screen || [];

            // Update display
            this.updateDisplay();

            // Start auto-update
            this.startAutoUpdate();

            // Show control screen
            this.showScreen('control');

        } catch (error) {
            console.error('Load session error:', error);
            this.showErrorScreen(error.message || 'Failed to load spa session');
        }
    }

    updateDisplay() {
        this.updateTemperatureDisplay();
        this.updateSpaControls();
        this.updateLastRefresh();
    }

    updateTemperatureDisplay() {
        const currentTempElement = document.getElementById('current-temp');
        const targetTempElement = document.getElementById('target-temp');

        const tempDevice = this.devices.find(d => d.name === 'spa_temp');
        const setPointDevice = this.devices.find(d => d.name === 'spa_set_point');

        if (tempDevice && tempDevice.state) {
            currentTempElement.textContent = `${tempDevice.state}°F`;
        } else {
            currentTempElement.textContent = '--°F';
        }

        if (setPointDevice && setPointDevice.state) {
            targetTempElement.textContent = `${setPointDevice.state}°F`;
        } else {
            targetTempElement.textContent = '--°F';
        }
    }

    updateSpaControls() {
        // Update spa mode
        const spaMode = this.findDevice('spa_mode') || this.findDeviceByLabel('spa');
        this.updateControlStatus('spa-mode', spaMode);

        // Update spa heat
        const spaHeat = this.findDevice('spa_heater') || this.findDeviceByLabel('spa heat');
        this.updateControlStatus('spa-heat', spaHeat);

        // Update filter pump
        const filterPump = this.findDevice('filter_pump') || this.findDeviceByLabel('filter') || this.findDeviceByLabel('pump');
        this.updateControlStatus('filter-pump', filterPump);
    }

    findDevice(deviceName) {
        return this.devices.find(d => d.name === deviceName);
    }

    findDeviceByLabel(labelText) {
        return this.devices.find(d => d.label && d.label.toLowerCase().includes(labelText.toLowerCase()));
    }

    updateControlStatus(controlId, device) {
        const control = document.getElementById(`${controlId}-control`);
        const status = document.getElementById(`${controlId}-status`);

        if (device) {
            const isActive = device.state === '1' || device.state === 1;
            control.classList.toggle('active', isActive);
            status.textContent = isActive ? 'ON' : 'OFF';
        } else {
            control.classList.remove('active');
            status.textContent = 'N/A';
        }
    }

    async toggleSpaMode() {
        const device = this.findDevice('spa_mode') || this.findDeviceByLabel('spa');
        if (device) {
            await this.toggleDevice(device);
        }
    }

    async toggleSpaHeat() {
        const device = this.findDevice('spa_heater') || this.findDeviceByLabel('spa heat');
        if (device) {
            await this.toggleDevice(device);
        }
    }

    async toggleFilterPump() {
        const device = this.findDevice('filter_pump') || this.findDeviceByLabel('filter') || this.findDeviceByLabel('pump');
        if (device) {
            await this.toggleDevice(device);
        }
    }

    async toggleDevice(device) {
        if (this.isUpdating) return;

        const currentState = device.state === '1' || device.state === 1;
        const newState = currentState ? '0' : '1';

        try {
            await this.controlDevice(device.name, newState);

            // Update local state immediately for better UX
            device.state = newState;
            this.updateDisplay();

            // Force refresh after a short delay
            setTimeout(() => {
                this.updateDeviceStates();
            }, 2000);

        } catch (error) {
            console.error('Toggle device error:', error);
            this.showError(`Failed to control ${device.label || device.name}`);
        }
    }

    async adjustTemperature(adjustment) {
        const setPointDevice = this.findDevice('spa_set_point');
        if (!setPointDevice) return;

        const currentTemp = parseInt(setPointDevice.state) || 80;
        const newTemp = Math.max(60, Math.min(110, currentTemp + adjustment));

        try {
            await this.controlDevice('spa_set_point', newTemp.toString());

            // Update local state
            setPointDevice.state = newTemp.toString();
            this.updateTemperatureDisplay();

        } catch (error) {
            console.error('Adjust temperature error:', error);
            this.showError('Failed to adjust temperature');
        }
    }

    async controlDevice(deviceName, value) {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'control_device',
                api_key: this.apiKey,
                authentication_token: this.auth.authentication_token,
                user_id: this.auth.user_id,
                serial: this.selectedSystem.serial_number,
                device: deviceName,
                command: value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to control device');
        }

        return data;
    }

    async updateDeviceStates() {
        if (this.isUpdating) return;

        this.isUpdating = true;

        try {
            await this.loadSessionData();
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error('Update device states error:', error);
            this.updateConnectionStatus(false);
        } finally {
            this.isUpdating = false;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');

        if (connected) {
            statusDot.classList.remove('disconnected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
        }
    }

    updateLastRefresh() {
        const lastUpdatedElement = document.getElementById('last-updated');
        lastUpdatedElement.textContent = new Date().toLocaleTimeString();
    }

    startAutoUpdate() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Start new interval (every 30 seconds)
        this.updateInterval = setInterval(() => {
            this.updateDeviceStates();
        }, 30000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    handleLogout() {
        // Clear authentication
        this.auth = null;
        this.selectedSystem = null;
        this.devices = [];

        // Clear session storage
        sessionStorage.removeItem('spa_auth');

        // Stop auto-update
        this.stopAutoUpdate();

        // Reset form
        document.getElementById('login-form').reset();

        // Show login screen
        this.showScreen('login');
    }

    showError(message) {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showErrorScreen(message) {
        document.getElementById('error-message').textContent = message;
        this.showScreen('error');
    }

    // Auto-login from session storage
    tryAutoLogin() {
        const savedAuth = sessionStorage.getItem('spa_auth');
        if (savedAuth) {
            try {
                this.auth = JSON.parse(savedAuth);
                this.showScreen('loading');
                this.loadDevices();
            } catch (error) {
                console.error('Auto-login error:', error);
                sessionStorage.removeItem('spa_auth');
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.spaController = new SimpleSpaController();
});

// Handle page visibility changes to pause/resume updates
document.addEventListener('visibilitychange', () => {
    if (window.spaController) {
        if (document.hidden) {
            window.spaController.stopAutoUpdate();
        } else {
            window.spaController.startAutoUpdate();
        }
    }
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});