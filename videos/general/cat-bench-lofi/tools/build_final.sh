#!/bin/bash
# 배경 준비(느리게 + 60fps) → 최종 렌더. 사용: tools/build_final.sh [재생속도(기본 0.85)]
set -e
SLOW=${1:-0.85}
P=/home/user/Motion-studio/videos/general/cat-bench-lofi
S=/tmp/claude-0/s
python3 $P/tools/prep_bg.py $P/clips/veo_bench.mp4 $S/bg24c.mp4 $(python3 -c "print(27*$SLOW)")
ffmpeg -v error -y -i $S/bg24c.mp4 -vf "setpts=PTS/$SLOW,scale=720:1080:flags=area,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1440:2160:flags=lanczos" -t 27 -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p $P/public/bg60.mp4
cd /home/user/Motion-studio && mkdir -p $P/render
npx remotion render $P/src/index.tsx LyricShort $P/render/luolei_final.mp4 --public-dir=$P/public --browser-executable /opt/pw-browsers/chromium --gl=swangle --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=4
echo BUILD_DONE
