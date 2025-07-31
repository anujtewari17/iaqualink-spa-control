import express from 'express';
import iaqualinkService from '../services/iaqualink.js';
import { isLocationAllowed, locations } from '../services/location.js';
import notificationService from '../services/notification.js';
import usageLogger from '../services/usageLogger.js';

const router = express.Router();

// Get spa status
router.get('/status', async (req, res) => {
  console.log(`Status request from ${req.ip}`);
  try {
    const status = await iaqualinkService.getSpaStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting spa status:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve spa status',
      message: error.message 
    });
  }
});

// Get AUX circuit status
router.get('/aux-status', async (req, res) => {
  console.log(`AUX status request from ${req.ip}`);
  try {
    const aux = await iaqualinkService.getDeviceStatus();
    res.json(aux);
  } catch (error) {
    console.error('Error getting aux status:', error);
    res.status(500).json({
      error: 'Failed to retrieve aux status',
      message: error.message,
    });
  }
});

// Toggle spa device
let shutdownTimer = null;
let notifyTimer = null;
const AUTO_SHUTDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours
const NOTIFY_THRESHOLD_MS = 2.5 * 60 * 60 * 1000; // 2.5 hours

function scheduleAutoShutdown() {
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
  }
  if (notifyTimer) {
    clearTimeout(notifyTimer);
  }
  notifyTimer = setTimeout(async () => {
    await notificationService.notify(
      'Spa equipment has been running for over 2.5 hours.'
    );
  }, NOTIFY_THRESHOLD_MS);
  shutdownTimer = setTimeout(async () => {
    try {
      console.log('Auto shutdown timer triggered');
      await iaqualinkService.turnOffAllEquipment();
    } catch (err) {
      console.error('Auto shutdown failed:', err.message);
    }
  }, AUTO_SHUTDOWN_MS);
  console.log('Auto shutdown scheduled in 3 hours');
}

router.post('/toggle/:device', async (req, res) => {
  try {
    const { device } = req.params;
    console.log(`Toggle request for ${device} from ${req.ip}`);

    // Validate device parameter
    const validDevices = ['spa-mode', 'spa-heater', 'jet-pump', 'filter-pump'];
    if (!validDevices.includes(device)) {
      return res.status(400).json({ 
        error: 'Invalid device',
        validDevices 
      });
    }

    await iaqualinkService.toggleDevice(device);
    console.log(`${device} toggled`);

    // Wait briefly for the system to update before reading status
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fetch updated status after toggle
    const status = await iaqualinkService.getSpaStatus();

    if (device === 'spa-mode') {
      if (status.spaMode) {
        usageLogger.startSession();
        scheduleAutoShutdown();
      } else {
        usageLogger.endSession();
        if (shutdownTimer) {
          clearTimeout(shutdownTimer);
          shutdownTimer = null;
        }
        if (notifyTimer) {
          clearTimeout(notifyTimer);
          notifyTimer = null;
        }
      }
    }

    res.json({
      success: true,
      device,
      message: `${device} toggled successfully`,
      status
    });
    console.log(`${device} toggle handled successfully`);
  } catch (error) {
    console.error(`Error toggling ${req.params.device}:`, error);
    res.status(500).json({ 
      error: `Failed to toggle ${req.params.device}`,
      message: error.message 
    });
  }
});

// Set spa temperature
router.post('/set-temperature', async (req, res) => {
  try {
    const { temperature } = req.body;
    console.log(`Set temperature request to ${temperature} from ${req.ip}`);
    
    // Validate temperature range
    if (!temperature || temperature < 80 || temperature > 104) {
      return res.status(400).json({ 
        error: 'Invalid temperature',
        message: 'Temperature must be between 80°F and 104°F' 
      });
    }

    await iaqualinkService.setSpaTemperature(temperature);

    // Wait briefly for the system to update
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fetch updated status
    const status = await iaqualinkService.getSpaStatus();

    res.json({
      success: true,
      temperature,
      message: `Spa temperature set to ${temperature}°F`,
      status
    });
    console.log(`Temperature set to ${temperature}`);
  } catch (error) {
    console.error('Error setting spa temperature:', error);
    res.status(500).json({ 
      error: 'Failed to set spa temperature',
      message: error.message 
    });
  }
});

// Get device information
router.get('/devices', async (req, res) => {
  try {
    console.log(`Devices request from ${req.ip}`);
    await iaqualinkService.ensureAuthenticated();
    res.json({
      devices: iaqualinkService.devices,
      currentDevice: iaqualinkService.currentDevice
    });
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve devices',
      message: error.message 
    });
  }
});

// Manual shutdown endpoint for scheduled jobs
router.post('/shutdown', async (req, res) => {
  try {
    console.log(`Manual shutdown requested from ${req.ip}`);
    await iaqualinkService.turnOffAllEquipment();
    res.json({ success: true });
    console.log('Manual shutdown completed');
  } catch (error) {
    console.error('Error running shutdown:', error);
    res.status(500).json({
      error: 'Failed to run shutdown',
      message: error.message,
    });
  }
});

// Optional location check
router.post('/check-location', (req, res) => {
  if (!locations.length) {
    return res.json({ allowed: true });
  }

  const { latitude, longitude } = req.body;
  console.log(`Location check from ${req.ip}: ${latitude},${longitude}`);
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }
  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);
  const allowed = isLocationAllowed(latNum, lonNum);
  console.log(`Location allowed: ${allowed}`);
  res.json({ allowed });
});





export default router;
