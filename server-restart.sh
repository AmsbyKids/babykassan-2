#!/bin/bash

echo "=== SERVEROMSTART $(date) ==="

# Sätt miljövariabler
export NODE_ENV=production
export PORT=5000
export REPLIT_DEPLOYMENT=1

# Förbättrad process-hantering
trap 'kill $(jobs -p)' EXIT SIGTERM SIGINT

echo "1. Avslutar gamla Node-processer"
pkill -f "node" || true
sleep 2
pkill -f "node aiQueryService.js" || true
pkill -f "server-watchdog.sh" || true
sleep 3

echo "2. Kontrollera port 5000"
if ! lsof -i:5000 > /dev/null; then
  echo "✅ Port 5000 är ledig"
else
  echo "⚠️ Port 5000 används – försöker frigöra..."
  fuser -k 5000/tcp || true
  sleep 3
fi

echo "3. Rensar loggar"
mkdir -p logs
echo "" > logs/server.log
echo "" > logs/ai.log
echo "" > logs/watchdog.log

echo "4. Sätter rättigheter"
chmod +x server-watchdog.sh

# Sätt NODE_ENV och andra viktiga miljövariabler
export NODE_ENV=production
export PORT=5000

echo "5. Startar huvudserver (index.js)"
cd "$(dirname "$0")"
for i in {1..5}; do
  echo "Försök $i/5 att starta huvudserver..."
  setsid node index.js > logs/server.log 2>&1 &
  SERVER_PID=$!
  echo $SERVER_PID > logs/server.pid
  echo "📦 Server PID: $SERVER_PID"
  disown $SERVER_PID

  # Vänta och verifiera att processen fortfarande kör
  sleep 5
  if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Huvudserver startad framgångsrikt"
    break
  else
    echo "⚠️ Försök $i misslyckades, försöker igen..."
    pkill -f "node index.js" || true
    sleep 2
  fi
done

echo "6. Startar aiQueryService"
for i in {1..5}; do
  echo "Försök $i/5 att starta AI-tjänsten..."
  NODE_ENV=production setsid node aiQueryService.js > logs/ai.log 2>&1 &
  AI_PID=$!
  echo $AI_PID > logs/ai.pid
  echo "🤖 AI Service PID: $AI_PID"
  disown $AI_PID
  sleep 5
  
  if ps -p $AI_PID > /dev/null; then
    echo "✅ AI-tjänsten startad framgångsrikt"
    break
  else
    echo "⚠️ AI-tjänsten startade inte, försöker igen..."
    pkill -f "node aiQueryService.js" || true
    sleep 2
  fi
done

echo "7. Startar watchdog"
setsid bash ./server-watchdog.sh > logs/watchdog.log 2>&1 &
WATCHDOG_PID=$!
echo "🔍 Watchdog PID: $WATCHDOG_PID"
disown $WATCHDOG_PID
sleep 5

# Spara PID-filer för watchdog
echo $SERVER_PID > logs/server.pid
echo $AI_PID > logs/ai.pid
echo $WATCHDOG_PID > logs/watchdog.pid

echo "8. Verifierar att processerna körs..."
sleep 3

verify_process() {
  local pid=$1
  local name=$2
  local max_attempts=5
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if ps -p $pid > /dev/null; then
      echo "✅ $name är igång (PID: $pid)"
      return 0
    else
      echo "⚠️ Försök $attempt/$max_attempts för $name..."
      sleep 3
      attempt=$((attempt + 1))
    fi
  done

  echo "❌ $name (PID: $pid) startade inte efter $max_attempts försök"
  return 1
}

failed=0
verify_process $SERVER_PID "Huvudserver" || failed=1
verify_process $AI_PID "AI Service" || failed=1
verify_process $WATCHDOG_PID "Watchdog" || failed=1

if [ $failed -eq 0 ]; then
  echo "✅ Alla processer är igång!"
  exit 0
else
  echo "❌ En eller flera processer startade inte!"
  exit 1
fi