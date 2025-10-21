/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Allow importing .js files from lib/
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

    // Allow importing modules without transpiling
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // Allow OpenAI API calls from browser
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
