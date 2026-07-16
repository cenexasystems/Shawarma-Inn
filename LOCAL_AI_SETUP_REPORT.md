# Local AI Coding Setup Report

Date: 2026-06-26

## Installed Components

- OS: Windows 11
- Ollama: 0.30.9
- VS Code Continue extension: continue.continue 2.0.0
- Provider: Ollama
- Endpoint: http://localhost:11434
- Selected model: qwen2.5-coder:7b

## Model Selection

Detected physical RAM: 16,587,612,160 bytes, about 15.45 GiB.

Selected qwen2.5-coder:7b. The preferred 14B model was not selected because a 14B coder model can push a 16 GB laptop into paging once VS Code, browser tabs, and background services are open. The 7B model is the largest comfortable choice for responsive coding assistance on this HP Envy x360 with integrated Intel Iris graphics.

## Continue Configuration

Continue user config was written to:

`%USERPROFILE%\.continue\config.yaml`

Configured models:

- Qwen2.5-Coder 7B Local: chat, edit, apply
- Qwen2.5-Coder 7B Autocomplete: autocomplete

Conservative defaults:

- Chat/edit/apply context: 4096 tokens
- Autocomplete context: 2048 tokens
- Chat/edit/apply max output: 512 tokens
- Autocomplete max output: 128 tokens
- Temperature: 0.1 to 0.2

## Hardware Optimization

User-level Ollama environment defaults were set:

- `OLLAMA_NUM_PARALLEL=1`
- `OLLAMA_MAX_LOADED_MODELS=1`
- `OLLAMA_KEEP_ALIVE=5m`

These keep only one model active at a time and avoid concurrent generations that would make the laptop hotter and less responsive.

Ollama was restarted after setting these values, and the local endpoint responded successfully afterward.

## Verification Results

- Ollama installed: yes
- Ollama on PATH: yes
- Ollama service responding: yes, http://localhost:11434/api/version returned 0.30.9
- Model downloaded: yes, qwen2.5-coder:7b, 4.7 GB
- Model response verified: yes
- Continue extension installed: yes, continue.continue 2.0.0
- Continue configured for Ollama: yes
- VS Code integration: extension installed and Continue config present

Direct model test:

- Prompt: write a concise JavaScript `add` function
- Response: valid JavaScript function plus explanation
- Total wall time: 37.10 seconds
- Generated tokens: 38
- Generation speed: 4.43 tokens/sec
- Prompt tokens: 50

## Expected Runtime

Estimated RAM use:

- Model file: 4.7 GB
- Expected active runtime memory: roughly 6 to 8 GB depending on context and backend allocation
- Recommended free system RAM before heavy use: at least 5 GB

Expected speed:

- Short CPU-oriented coding responses: about 4 to 6 tokens/sec on this setup
- First response after idle can be slower while the model loads
- Subsequent short responses may feel better if the model remains warm

Recommended maximum context:

- Daily coding: 4096 tokens
- Autocomplete: 2048 tokens
- Avoid 8192+ tokens unless the laptop is cool, plugged in, and not multitasking heavily

## Hardware Limitations

- Integrated Intel Iris graphics is not ideal for large local LLM acceleration.
- 16 GB RAM is enough for 7B coding models, but not comfortable for 14B+ while using VS Code and a browser.
- Long context windows increase RAM use and heat.
- Parallel requests should stay disabled for responsiveness.

## Future Upgrade Recommendations

- Best near-term model experiment: qwen2.5-coder:7b variants or smaller autocomplete-specialized models.
- If upgrading hardware, prioritize 32 GB RAM.
- For much faster local coding models, use a machine with a discrete NVIDIA GPU and at least 8 GB VRAM.
- If cloud use is acceptable later, keep local Ollama for private/offline work and use a hosted model for larger refactors.
