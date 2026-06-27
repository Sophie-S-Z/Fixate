import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow SharedArrayBuffer needed by MediaPipe WASM
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
  // Bundle @mediapipe/tasks-vision only on client
  serverExternalPackages: [],
}

export default nextConfig
