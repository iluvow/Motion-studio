#!/usr/bin/env bash
# 분석용 파이썬 환경 설치 (최초 1회). 사용: bash pipeline/setup.sh
set -e
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
.venv/bin/pip install -q demucs soundfile faster-whisper librosa numpy scipy
npm install --no-audit --no-fund
echo "setup done"
