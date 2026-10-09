/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    logging: {
        fetches: {
          fullUrl: true
        }
      }

};

module.exports = nextConfig;
