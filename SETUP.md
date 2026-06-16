# 🎰 CHANGOSBET — Guía de instalación

## Requisitos
- Node.js 18+
- npm 9+

## Instalación rápida

```bash
# Desde la carpeta raíz
npm install
npm run install:all
```

## Configurar variables de entorno

### Backend
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores
```

### Frontend
```bash
cp frontend/.env.local.example frontend/.env.local
# Editar frontend/.env.local con tus valores
```

> **Sin Supabase:** El casino funciona igual sin configurar Supabase.
> Los balances se guardan en memoria del servidor (se resetean al reiniciar).
> Para persistencia, configurar Supabase (opcional).

## Correr en desarrollo

```bash
# Corre backend (puerto 3001) y frontend (puerto 3000) juntos
npm run dev
```

O por separado:
```bash
npm run dev:backend   # Solo el servidor
npm run dev:frontend  # Solo el frontend
```

## Abrir el casino
Ir a: http://localhost:3000

## Flujo de uso
1. Entrar con un alias
2. Crear una sala y elegir el juego
3. Copiar el código de 6 caracteres
4. Pasarle el código a tus amigos
5. Los amigos entran en "Unirse a sala"
6. ¡A jugar!

## Juegos disponibles
- 🎡 Ruleta Europea (ciclo automático de 20s)
- 🃏 Blackjack multijugador (15s para apostar)
- ♠️ Texas Hold'em Poker (manual, el host inicia cada mano)
- 🏇 Carreras de Caballos (ciclo automático de 20s)
- ⚽ Apuestas de Fútbol (25s para apostar, luego simulación en vivo)

## Recargar fichas
Si quedás en cero, el botón "Recargar" te da $100,000 al instante.
