#!/bin/bash

# Smart startup script for web-loom development
# Handles sequential startup to avoid port conflicts and race conditions

echo "🚀 Starting Web-Loom Development Environment"
echo "============================================="
echo ""

# First, clean up any existing processes
echo "🧹 Cleaning up existing processes..."
./kill_ports.sh
echo ""

# Function to check if a port is available
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 1  # Port is in use
  else
    return 0  # Port is available
  fi
}

# Function to wait for a port to become active
wait_for_port() {
  local port=$1
  local timeout=${2:-30}  # Default 30 seconds timeout
  local count=0
  
  echo "   ⏳ Waiting for port $port to become active..."
  
  while [ $count -lt $timeout ]; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "   ✅ Port $port is now active"
      return 0
    fi
    sleep 1
    count=$((count + 1))
  done
  
  echo "   ⚠️  Timeout waiting for port $port"
  return 1
}

# Start apps in a specific order to avoid conflicts
declare -a apps=(
  "api:8000:Node.js API"
  "docs:3000:Documentation (Next.js)"
  "mvvm-book:3001:MVVM Book (Next.js)"
  "mvvm-angular:4200:Angular MVVM Demo"
  "mvvm-react:5173:React MVVM Demo"
  "mvvm-vue:5174:Vue MVVM Demo"
  "mvvm-vanilla:5175:Vanilla JS MVVM Demo"
  "mvvm-lit:5176:Lit Element MVVM Demo"
)

declare -a pids=()

start_app() {
  local app_info=$1
  local app_name=$(echo $app_info | cut -d':' -f1)
  local port=$(echo $app_info | cut -d':' -f2)
  local description=$(echo $app_info | cut -d':' -f3)
  
  echo "🎯 Starting $description"
  echo "   📂 Directory: apps/$app_name"
  echo "   🌐 Expected port: $port"
  
  # Check if port is available
  if ! check_port $port; then
    echo "   ❌ Port $port is already in use! Skipping $app_name"
    return 1
  fi
  
  # Start the app
  cd "apps/$app_name" 2>/dev/null || {
    echo "   ❌ Directory apps/$app_name not found"
    cd ../..
    return 1
  }
  
  # Start in background and capture PID
  npm run dev > "/tmp/web-loom-$app_name.log" 2>&1 &
  local app_pid=$!
  pids+=($app_pid)
  
  echo "   🔧 Started with PID $app_pid"
  echo "   📄 Logs: /tmp/web-loom-$app_name.log"
  
  cd ../..
  
  # Wait a bit for the app to start
  sleep 3
  
  # Check if process is still running
  if ! kill -0 $app_pid 2>/dev/null; then
    echo "   ❌ Process died during startup. Check logs: /tmp/web-loom-$app_name.log"
    return 1
  fi
  
  # Wait for port to become active (with timeout)
  if wait_for_port $port 15; then
    echo "   🎉 $description is ready at http://localhost:$port"
  else
    echo "   ⚠️  $description started but port $port not responding"
    echo "       Check logs: /tmp/web-loom-$app_name.log"
  fi
  
  echo ""
  return 0
}

# Trap to clean up on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down all development servers..."
  for pid in "${pids[@]}"; do
    if kill -0 $pid 2>/dev/null; then
      echo "   Stopping process $pid"
      kill $pid 2>/dev/null
    fi
  done
  
  # Give processes time to shut down gracefully
  sleep 3
  
  # Force kill any remaining processes
  for pid in "${pids[@]}"; do
    if kill -0 $pid 2>/dev/null; then
      echo "   Force killing process $pid"
      kill -9 $pid 2>/dev/null
    fi
  done
  
  echo "✅ Cleanup complete"
  exit 0
}

# Set up signal handlers
trap cleanup INT TERM EXIT

# Start all apps
echo "Starting apps in sequence to avoid conflicts..."
echo ""

for app_info in "${apps[@]}"; do
  start_app "$app_info"
  # Brief pause between starts to avoid overwhelming the system
  sleep 2
done

echo "🎊 All apps started! Development environment is ready."
echo ""
echo "📊 Active Services:"
echo "├── 🌐 http://localhost:8000  - API Server"
echo "├── 📖 http://localhost:3000  - Documentation"
echo "├── 📚 http://localhost:3001  - MVVM Book"
echo "├── 🅰️  http://localhost:4200  - Angular Demo"
echo "├── ⚛️  http://localhost:5173  - React Demo"
echo "├── 💚 http://localhost:5174  - Vue Demo"
echo "├── 🔵 http://localhost:5175  - Vanilla JS Demo"
echo "└── 💡 http://localhost:5176  - Lit Element Demo"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep the script running and monitor processes
while true; do
  sleep 10
  
  # Check if any process has died
  for i in "${!pids[@]}"; do
    pid=${pids[$i]}
    if ! kill -0 $pid 2>/dev/null; then
      echo "⚠️  Process $pid has died unexpectedly"
      # Remove dead PID from array
      unset pids[$i]
    fi
  done
  
  # If all processes have died, exit
  if [ ${#pids[@]} -eq 0 ]; then
    echo "❌ All processes have died. Exiting."
    break
  fi
done