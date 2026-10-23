#!/usr/bin/env bash
# ==============================================================================
# Setup Qwen 2.5 for Jobnity (Fast Local LLM via Ollama)
# ==============================================================================

set -e

CLR_BOLD="\033[1m"
CLR_GREEN="\033[0;32m"
CLR_CYAN="\033[0;36m"
CLR_YELLOW="\033[1;33m"
CLR_RED="\033[0;31m"
CLR_RESET="\033[0m"

echo -e "${CLR_BOLD}${CLR_CYAN}🧠 Jobnity Qwen 2.5 Setup Assistant${CLR_RESET}"
echo "-----------------------------------------------------"

# 1. Check Hardware / GPU
echo -e "${CLR_YELLOW}1. Checking Hardware & GPU Acceleration...${CLR_RESET}"
if command -v nvidia-smi &>/dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n1 || echo "NVIDIA GPU")
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -n1 || echo "Unknown")
    echo -e "   ${CLR_GREEN}✓ Detected GPU:${CLR_RESET} $GPU_NAME ($GPU_MEM VRAM)"
    echo -e "   ${CLR_GREEN}✓ Optimal Model:${CLR_RESET} qwen2.5:3b (Fits completely in VRAM for ~45+ tokens/sec)"
    RECOMMENDED_MODEL="qwen2.5:3b"
else
    echo -e "   ${CLR_YELLOW}! No NVIDIA GPU detected. Running in high-speed CPU mode.${CLR_RESET}"
    echo -e "   ${CLR_GREEN}✓ Recommended Model:${CLR_RESET} qwen2.5:1.5b or qwen2.5:3b"
    RECOMMENDED_MODEL="qwen2.5:3b"
fi

MODEL_TO_PULL="${1:-$RECOMMENDED_MODEL}"

# 2. Check Ollama Installation
echo -e "\n${CLR_YELLOW}2. Verifying Ollama Engine...${CLR_RESET}"
if ! command -v ollama &>/dev/null || ! ollama --version &>/dev/null; then
    echo -e "   ${CLR_RED}✗ Ollama is not installed or has permission issues on /usr/local/bin/ollama.${CLR_RESET}"
    echo -e "   Run the official installer with sudo to set correct permissions:"
    echo -e "   ${CLR_BOLD}${CLR_CYAN}curl -fsSL https://ollama.com/install.sh | sudo sh${CLR_RESET}\n"
    exit 1
else
    echo -e "   ${CLR_GREEN}✓ Ollama is installed: $(ollama --version)${CLR_RESET}"
fi

# 3. Ensure Ollama Server is Running
echo -e "\n${CLR_YELLOW}3. Checking Ollama Daemon...${CLR_RESET}"
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "   ${CLR_GREEN}✓ Ollama service is already active on http://localhost:11434${CLR_RESET}"
else
    echo -e "   Starting Ollama server in background..."
    mkdir -p "$HOME/.jobnity"
    nohup ollama serve > "$HOME/.jobnity/ollama.log" 2>&1 &
    sleep 3
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "   ${CLR_GREEN}✓ Ollama service started successfully.${CLR_RESET}"
    else
        echo -e "   ${CLR_RED}Failed to reach Ollama at localhost:11434. Please run 'ollama serve' manually.${CLR_RESET}"
        exit 1
    fi
fi

# 4. Pull Qwen 2.5 Model
echo -e "\n${CLR_YELLOW}4. Pulling $MODEL_TO_PULL...${CLR_RESET}"
ollama pull "$MODEL_TO_PULL"

# 5. Test Inference
echo -e "\n${CLR_YELLOW}5. Testing Qwen 2.5 with Jobnity Backend...${CLR_RESET}"
TEST_RESP=$(curl -s http://localhost:11434/api/generate -d "{\"model\": \"$MODEL_TO_PULL\", \"prompt\": \"You are the Jobnity AI interviewer. Greet the candidate in one concise sentence.\", \"stream\": false}" | grep -o '"response":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$TEST_RESP" ]; then
    echo -e "   ${CLR_GREEN}✓ Qwen 2.5 Response:${CLR_RESET} \"$TEST_RESP\""
    echo -e "\n${CLR_BOLD}${CLR_GREEN}=====================================================${CLR_RESET}"
    echo -e "${CLR_BOLD}${CLR_GREEN}    ✨ QWEN 2.5 IS CONFIGURED AND READY FOR JOBNITY!  ${CLR_RESET}"
    echo -e "${CLR_BOLD}${CLR_GREEN}=====================================================${CLR_RESET}"
    echo -e "  • Model:        ${CLR_CYAN}$MODEL_TO_PULL${CLR_RESET}"
    echo -e "  • Endpoint:     ${CLR_CYAN}http://localhost:11434${CLR_RESET}"
    echo -e "  • Features:     Technical Mock Interviews & Answer Evaluation"
    echo -e "  • Web UI:       ${CLR_CYAN}http://localhost:5173/interview${CLR_RESET}"
    echo -e "${CLR_BOLD}${CLR_GREEN}=====================================================${CLR_RESET}"
else
    echo -e "   ${CLR_YELLOW}Model pulled, ready for requests.${CLR_RESET}"
fi
