#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 正在启动猜历史人物..."
npm run dev &
sleep 3
open http://localhost:3000
wait
