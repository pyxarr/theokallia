#!/bin/bash

PORT=3333
URL="http://localhost:$PORT/v1/products"
LIMIT=10
TOTAL_REQUESTS=15

echo "Cleaning up port $PORT..."
# Use a loop to kill all processes on that port
while netstat -ano | grep :$PORT | grep LISTENING > /dev/null; do
  PID=$(netstat -ano | grep :$PORT | grep LISTENING | awk '{print $NF}' | head -1)
  cmd //c "taskkill /F /PID $PID" 2>/dev/null
  sleep 1
done

echo "Starting server via pnpm..."
pnpm --filter @theokallia/api start &
# We can't easily get the PID of the actual nest process via pnpm
# so we will rely on the health check loop

echo "Waiting for server to be healthy..."
MAX_RETRIES=30
COUNT=0
while ! curl -s $URL > /dev/null; do
  echo -n "."
  sleep 1
  ((COUNT++))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo -e "\nServer failed to start in time."
    exit 1
  fi
done
echo -e "\nServer is UP!"

echo "Sending $TOTAL_REQUESTS requests to $URL..."
SUCCESS=0
LIMITED=0
ERRORS=0

for i in $(seq 1 $TOTAL_REQUESTS); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL)
  if [ "$CODE" -eq 200 ]; then
    ((SUCCESS++))
  elif [ "$CODE" -eq 429 ]; then
    ((LIMITED++))
  else
    ((ERRORS++))
  fi
  if (( i % 20 == 0 )); then
    echo "Request $i/$TOTAL_REQUESTS... (Code: $CODE)"
  fi
done

echo -e "\n--- Rate Limit Test Results ---"
echo "Total Requests: $TOTAL_REQUESTS"
echo "Successful (200): $SUCCESS"
echo "Rate Limited (429): $LIMITED"
echo "Other Errors: $ERRORS"

if [ $LIMITED -gt 0 ]; then
  echo "✅ Rate limiting is WORKING."
else
  echo "❌ Rate limiting FAILED. No 429s received."
fi

echo "Cleaning up..."
# Kill all processes on port 3333 again
while netstat -ano | grep :$PORT | grep LISTENING > /dev/null; do
  PID=$(netstat -ano | grep :$PORT | grep LISTENING | awk '{print $NF}' | head -1)
  cmd //c "taskkill /F /PID $PID" 2>/dev/null
  sleep 1
done
echo "Done."
