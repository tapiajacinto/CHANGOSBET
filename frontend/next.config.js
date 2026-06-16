/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las variables NEXT_PUBLIC_* se inyectan automáticamente desde .env.local.
  // (Se eliminó NEXT_PUBLIC_SOCKET_URL: arquitectura 100% Vercel + Supabase, sin Socket.io.)
  eslint: {
    // El gate de tipos es `tsc --noEmit` (corre en CI). Evitamos que ESLint
    // (sin config interactiva) bloquee el build de producción.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
