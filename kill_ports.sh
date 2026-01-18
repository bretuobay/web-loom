#!/bin/bash

# Enhanced kill script for web-loom experimental apps
# Systematic port assignments for web-loom experimental apps
# Next.js apps: 3000-3099
# Angular apps: 4200-4299  
# Vite apps: 5173-5199
# API/Backend: 8000-8099

ports=(
  # Next.js apps (3000-3099)
  3000  # docs (Next.js)
  3001  # mvvm-book (Next.js)
  3002  # plugin-docs (Next.js)
  # Angular apps (4200-4299)
  4200  # mvvm-angular (Angular)
  # Vite apps (5173-5199)
  5173  # mvvm-react (Vite)
  5174  # mvvm-vue (Vite)
  5175  # mvvm-vanilla (Vite)
  5176  # mvvm-lit (Vite)
  5177  # mvvm-react-integrated (Vite)
  5178  # task-flow-ui (Vite)
  5179  # ui-patterns-playground (Vite)
  5180  # plugin-react (Vite)
  # API/Backend (8000-8099)
  8000  # api (Node.js/Express)
  8001  # task-flow-api (Node.js/Express)
)

echo "🧹 Cleaning up development server ports..."
echo "----------------------------------------"

killed_count=0

for port in "${ports[@]}"
do
  # Check for processes using the port
  pids=$(lsof -ti tcp:$port 2>/dev/null)
  
  if [ -n "$pids" ]; then
    echo "🔍 Found processes on port $port: $pids"
    
    # Try graceful shutdown first
    for pid in $pids; do
      echo "   🛑 Sending TERM signal to process $pid"
      kill -TERM $pid 2>/dev/null
    done
    
    # Wait a moment for graceful shutdown
    sleep 1
    
    # Check if processes are still running and force kill if needed
    remaining_pids=$(lsof -ti tcp:$port 2>/dev/null)
    if [ -n "$remaining_pids" ]; then
      for pid in $remaining_pids; do
        echo "   💥 Force killing process $pid"
        kill -9 $pid 2>/dev/null
      done
    fi
    
    echo "   ✅ Port $port cleared"
    killed_count=$((killed_count + 1))
  else
    echo "✓ Port $port is free"
  fi
done

echo "----------------------------------------"
if [ $killed_count -gt 0 ]; then
  echo "🎉 Cleared $killed_count port(s). All ports should now be available."
else
  echo "😊 All ports were already free!"
fi

# Also check for any lingering node processes that might interfere
echo ""
echo "🔍 Checking for any remaining development server processes..."
remaining_procs=$(ps aux | grep -E "(vite|next.*dev|ng serve|nodemon)" | grep -v grep | grep -v "extensions")

if [ -n "$remaining_procs" ]; then
  echo "⚠️  Found some remaining development processes:"
  echo "$remaining_procs"
  echo ""
  echo "You may want to manually check these processes."
else
  echo "✅ No remaining development processes found."
fi
