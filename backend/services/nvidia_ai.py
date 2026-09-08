"""
NVIDIA AI integration (https://integrate.api.nvidia.com/v1) for higher accuracy.
Reads NVIDIA_API_KEY from the environment. All models from the user's snippets:
- moonshotai/kimi-k3            (vision + text)
- deepseek-ai/deepseek-v4-pro-0813 (text reasoning)
- google/gemma-4-31b-it         (vision + text, thinking enabled)
Uses only the Python standard library (urllib) — no new dependencies.
"""
import json
import os
import urllib.request
import urllib.error

INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

MODELS = {
    "vision": "moonshotai/kimi-k3",
    "reasoning": "deepseek-ai/deepseek-v4-pro-0813",
    "vision_thinking": "google/gemma-4-31b-it",
}


def get_api_key():
    return (os.getenv("NVIDIA_API_KEY") or "").strip()


def is_configured():
    return bool(get_api_key())


def _post(payload, timeout=120):
    key = get_api_key()
    if not key:
        raise RuntimeError("NVIDIA_API_KEY is not set. Add it to your environment / Render env vars.")
    req = urllib.request.Request(
        INVOKE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")[:500]
        except Exception:
            body = ""
        raise RuntimeError(f"NVIDIA API error {e.code}: {body}")
    except Exception as e:
        raise RuntimeError(f"NVIDIA request failed: {e}")


def _content_text(data):
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(data)[:2000]


def analyze_image(image_url, question="What is in this image?", model=None):
    """Vision analysis (Kimi K3 / Gemma thinking). image_url can be http(s) or data:image/...;base64."""
    payload = {
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": question},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }],
        "model": model or MODELS["vision"],
        "max_tokens": 2048,
        "temperature": 0.2,
        "stream": False,
    }
    return {"model": payload["model"], "result": _content_text(_post(payload))}


def reason(prompt, model=None):
    """Text reasoning (DeepSeek pro, thinking off for direct answers)."""
    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "model": model or MODELS["reasoning"],
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": 2048,
        "stream": False,
        "extra_body": {"chat_template_kwargs": {"thinking": False}},
    }
    return {"model": payload["model"], "result": _content_text(_post(payload))}


def nutrition_verify(patient_summary, plan_text, model=None):
    """Cross-check a generated nutrition plan with a second AI model for accuracy."""
    prompt = (
        "You are a clinical nutrition reviewer. Patient summary:\n"
        f"{patient_summary}\n\nProposed plan:\n{plan_text}\n\n"
        "Verify safety (allergies, drug-food interactions, refeeding risk) and list any corrections."
    )
    return reason(prompt, model=model or MODELS["vision_thinking"])
