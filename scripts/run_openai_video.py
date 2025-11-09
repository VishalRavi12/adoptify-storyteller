#!/usr/bin/env python3
"""
Helper script to trigger OpenAI's video generation endpoint from the CLI.

Usage:
  python scripts/run_openai_video.py --pet-name Luna --pet-bio "Playful beagle..."
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests

OPENAI_VIDEOS_URL = "https://api.openai.com/v1/videos"


def resolve_key() -> str:
  key = os.getenv("OPENAI_API_KEY")
  if not key:
    raise RuntimeError(
      "OPENAI_API_KEY is not set. Export it or add it to your .env before running this script."
    )
  return key


def build_prompt(pet_name: str, pet_bio: str, override_prompt: Optional[str]) -> str:
  if override_prompt:
    return override_prompt
  return (
    f"Create a cinematic, 10-second adoption appeal for a dog named {pet_name}. "
    f"Highlight why viewers should adopt them. Dog bio: {pet_bio}"
  )


def create_job(api_key: str, prompt: str, model: str, seconds: str, size: str) -> str:
  form = {
    "model": (None, model),
    "prompt": (None, prompt),
    "seconds": (None, seconds),
    "size": (None, size),
  }
  response = requests.post(
    OPENAI_VIDEOS_URL,
    headers={"Authorization": f"Bearer {api_key}"},
    files=form,
    timeout=60,
  )
  response.raise_for_status()
  data = response.json()
  return data["id"]


def fetch_job(api_key: str, job_id: str) -> dict:
  response = requests.get(
    f"{OPENAI_VIDEOS_URL}/{job_id}",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=30,
  )
  response.raise_for_status()
  return response.json()


def download_video(api_key: str, job_id: str, output_path: Path) -> None:
  response = requests.get(
    f"{OPENAI_VIDEOS_URL}/{job_id}/content",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=120,
    stream=True,
  )
  response.raise_for_status()
  with output_path.open("wb") as file:
    for chunk in response.iter_content(chunk_size=8192):
      if chunk:
        file.write(chunk)


def main():
  parser = argparse.ArgumentParser(description="Generate an adoption video with OpenAI.")
  parser.add_argument("--pet-name", required=True, help="Dog's name.")
  parser.add_argument("--pet-bio", required=True, help="Dog's short bio.")
  parser.add_argument("--prompt", help="Optional prompt override.")
  parser.add_argument("--model", default=os.getenv("OPENAI_VIDEO_MODEL", "sora-2"))
  parser.add_argument("--seconds", default=os.getenv("OPENAI_VIDEO_SECONDS", "8"))
  parser.add_argument("--size", default=os.getenv("OPENAI_VIDEO_SIZE", "720x1280"))
  parser.add_argument("--output", default="openai-video.mp4")
  args = parser.parse_args()

  api_key = resolve_key()
  prompt = build_prompt(args.pet_name, args.pet_bio, args.prompt)

  print("Submitting video job to OpenAI...")
  job_id = create_job(api_key, prompt, args.model, args.seconds, args.size)
  print(f"Job id: {job_id}. Waiting for completion...")

  timeout_seconds = int(os.getenv("OPENAI_VIDEO_TIMEOUT_MS", "240000")) / 1000
  poll_interval = int(os.getenv("OPENAI_VIDEO_POLL_INTERVAL_MS", "5000")) / 1000
  deadline = time.time() + timeout_seconds
  status = "queued"

  while status in {"queued", "processing", "starting"}:
    if time.time() > deadline:
      raise RuntimeError("Timed out waiting for the video to finish.")
    time.sleep(poll_interval)
    job = fetch_job(api_key, job_id)
    status = job.get("status")
    print(f"Current status: {status}")

  if status != "completed":
    raise RuntimeError(f"Job failed with status: {status} / {job.get('error')}")

  output_path = Path(args.output)
  print("Downloading video asset...")
  download_video(api_key, job_id, output_path)
  print(f"Video saved to {output_path.resolve()}")


if __name__ == "__main__":
  try:
    main()
  except Exception as exc:
    sys.stderr.write(f"Error: {exc}\n")
    sys.exit(1)
