// Environment Variable Loader
console.log('🔧 Loading environment variables...');

// Global env object
window.ENV = {
    OPENAI_API_KEY: '',
    ASSISTANT_ID: '',
    VECTOR_STORE_ID: ''
};

// Load .env file
async function loadEnv() {
    try {
        const response = await fetch('.env');
        if (!response.ok) {
            console.warn('⚠️ No .env file found, using defaults');
            return;
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) return;
            
            // Parse KEY=VALUE
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            
            if (key && value) {
                window.ENV[key.trim()] = value;
            }
        });
        
        console.log('✅ Environment variables loaded');
        console.log('📋 API Key:', window.ENV.OPENAI_API_KEY ? '***' + window.ENV.OPENAI_API_KEY.slice(-8) : 'Not set');
        console.log('📋 Assistant ID:', window.ENV.ASSISTANT_ID || 'Not set');
        console.log('📋 Vector Store ID:', window.ENV.VECTOR_STORE_ID || 'Not set');
        
    } catch (error) {
        console.warn('⚠️ Error loading .env file:', error.message);
    }
}

// Export for use
window.loadEnv = loadEnv;
