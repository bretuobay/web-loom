#!/bin/bash

# Test script to verify individual app startups
# Usage: ./test_apps.sh [app_name]
# If no app_name provided, tests all apps sequentially

apps=(
  "docs:3000"
  "mvvm-book:3001" 
  "mvvm-angular:4200"
  "mvvm-react:5173"
  "mvvm-vue:5174"
  "mvvm-vanilla:5175"
  "mvvm-lit:5176"
  "mvvm-react-integrated:5177"
  "task-flow-ui:5178"
  "ui-patterns-playground:5179"
  "api:8000"
)

test_single_app() {
  local app_info=$1
  local app_name=$(echo $app_info | cut -d':' -f1)
  local expected_port=$(echo $app_info | cut -d':' -f2)
  
  echo "🧪 Testing $app_name (expected port: $expected_port)"
  echo "----------------------------------------"
  
  cd "apps/$app_name" 2>/dev/null || {
    echo "❌ Directory apps/$app_name not found"
    cd ../..
    return 1
  }
  
  echo "📂 Working directory: $(pwd)"
  echo "🔧 Running: npm run dev"
  echo ""
  
  # Start the app in background
  npm run dev &
  local dev_pid=$!
  
  echo "🚀 Started process $dev_pid"
  echo "⏳ Waiting 10 seconds for startup..."
  
  sleep 10
  
  # Check if the process is still running
  if kill -0 $dev_pid 2>/dev/null; then
    echo "✅ Process is running"
    
    # Check if the expected port is in use
    local port_check=$(lsof -ti tcp:$expected_port 2>/dev/null)
    if [ -n "$port_check" ]; then
      echo "✅ Port $expected_port is in use (as expected)"
      echo "🌐 You should be able to access: http://localhost:$expected_port"
    else
      echo "⚠️  Port $expected_port is not in use (unexpected)"
    fi
    
    # Stop the process
    echo "🛑 Stopping process $dev_pid"
    kill $dev_pid 2>/dev/null
    sleep 2
    kill -9 $dev_pid 2>/dev/null  # Force kill if needed
    
  else
    echo "❌ Process died during startup"
  fi
  
  cd ../..
  echo ""
}

# Main execution
echo "🔬 Web-Loom App Startup Test"
echo "=============================="
echo ""

if [ $# -eq 1 ]; then
  # Test specific app
  app_to_test=""
  for app_info in "${apps[@]}"; do
    app_name=$(echo $app_info | cut -d':' -f1)
    if [ "$app_name" = "$1" ]; then
      app_to_test=$app_info
      break
    fi
  done
  
  if [ -n "$app_to_test" ]; then
    test_single_app "$app_to_test"
  else
    echo "❌ App '$1' not found. Available apps:"
    for app_info in "${apps[@]}"; do
      app_name=$(echo $app_info | cut -d':' -f1)
      echo "   - $app_name"
    done
  fi
else
  # Test all apps
  echo "Testing all apps sequentially..."
  echo ""
  
  for app_info in "${apps[@]}"; do
    test_single_app "$app_info"
    sleep 2  # Brief pause between tests
  done
  
  echo "🎉 All tests completed!"
fi