// Test endpoint for debugging backend connectivity
window.testBackend = async function() {
    const backendURL = 'https://nh-backend-2-4goq.onrender.com';
    
    console.log('Testing backend at:', backendURL);
    
    try {
        // Test 1: Config endpoint (no auth needed)
        console.log('\n1. Testing /config endpoint...');
        const configResp = await fetch(`${backendURL}/config`);
        const configData = await configResp.json();
        console.log('✓ /config response:', configResp.status, configData);
        
        // Test 2: Login endpoint
        console.log('\n2. Testing /api/auth/login endpoint...');
        const loginResp = await fetch(`${backendURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrongpass' })
        });
        const loginData = await loginResp.json();
        console.log('✓ /api/auth/login response:', loginResp.status, loginData);
        
        // Test 3: Users endpoint
        console.log('\n3. Testing /api/users endpoint...');
        const usersResp = await fetch(`${backendURL}/api/users`);
        const usersData = await usersResp.json();
        console.log('✓ /api/users response:', usersResp.status, usersData);
        
        console.log('\n✅ Backend is responding!');
        return true;
        
    } catch (err) {
        console.error('\n❌ Backend test failed:', err);
        return false;
    }
};

// Run test automatically
console.log('=== Nyodera Heights Backend Test ===');
testBackend().then(success => {
    if (success) {
        console.log('\n✅ All systems operational!');
    } else {
        console.log('\n❌ Backend connection failed. Check the following:');
        console.log('1. Visit https://nh-backend-2-4goq.onrender.com/config in your browser');
        console.log('2. Check Render logs: https://dashboard.render.com');
        console.log('3. Verify environment variables are set in Render');
    }
});
