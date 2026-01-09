#!/bin/bash

ports=(3000 3001 3002 3003 3004 3005 8787 3700 5173 5174 5175 5176 6005 6007 8081)

for port in "${ports[@]}"
do
  pid=$(lsof -ti tcp:$port)
  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 $pid
    echo "Process on port $port killed"
  else
    echo "No process found on port $port"
  fi
done
