import express from 'express';
import iaqualinkService from '../services/iaqualink.js';

const router = express.Router();

// Get spa status
router.get('/status', async (req, res) => {
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

// Toggle spa device
router.post('/toggle/:device', async (req, res) => {
  try {
    const { device } = req.params;

    // Validate device parameter
    const validDevices = ['spa-mode', 'spa-heater', 'jet-pump'];
    if (!validDevices.includes(device)) {
      return res.status(400).json({ 
        error: 'Invalid device',
        validDevices 
      });
    }

    await iaqualinkService.toggleDevice(device);

    // Wait briefly for the system to update before reading status
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fetch updated status after toggle
    const status = await iaqualinkService.getSpaStatus();

    res.json({
      success: true,
      device,
      message: `${device} toggled successfully`,
      status
    });
  } catch (error) {
    console.error(`Error toggling ${req.params.device}:`, error);
    res.status(500).json({ 
      error: `Failed to toggle ${req.params.device}`,
      message: error.message 
    });
  }
});

// Get device information
router.get('/devices', async (req, res) => {
  try {
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

export default router;
