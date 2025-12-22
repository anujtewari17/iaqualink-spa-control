import paidAccessService from '../src/services/paidAccessService.js';
import { authMiddleware } from '../src/middleware/auth.js';

// Mock request and response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const mockNext = () => {
    let called = false;
    const next = () => {
        called = true;
    };
    next.isCalled = () => called;
    return next;
};

async function testAuthMiddleware() {
    process.env.ACCESS_KEY = 'admin-secret';
    const accessKey = 'guest-123';

    console.log('--- Testing Guest Access (Unpaid) ---');
    const req1 = { headers: { 'x-access-key': accessKey } };
    const res1 = mockRes();
    const next1 = mockNext();

    // We need to mock accessKeyService.validateKey to return true
    // For this simple script, we'll just check if paidAccessService.isPaid works as expected
    console.log(`Is guest-123 paid? ${paidAccessService.isPaid(accessKey)}`);

    if (!paidAccessService.isPaid(accessKey)) {
        console.log('✅ Correct: guest-123 is not paid initially');
    } else {
        console.error('❌ Error: guest-123 should not be paid');
    }

    console.log('\n--- Testing Payment Recording ---');
    paidAccessService.addPayment(accessKey, 2500, 1, 'session-abc');
    console.log(`Is guest-123 paid now? ${paidAccessService.isPaid(accessKey)}`);

    if (paidAccessService.isPaid(accessKey)) {
        console.log('✅ Correct: guest-123 is now paid');
    } else {
        console.error('❌ Error: guest-123 should be paid after addPayment');
    }

    console.log('\n--- Testing Admin Bypass ---');
    const reqAdmin = { headers: { 'x-access-key': 'admin-secret' } };
    const resAdmin = mockRes();
    const nextAdmin = mockNext();

    await authMiddleware(reqAdmin, resAdmin, nextAdmin);
    if (nextAdmin.isCalled()) {
        console.log('✅ Correct: Admin bypassed payment check');
    } else {
        console.error('❌ Error: Admin should have bypassed payment check');
    }
}

testAuthMiddleware();
