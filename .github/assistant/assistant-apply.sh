#!/usr/bin/env bash
# assistant-apply.sh
# Purpose: helper run by the Assistant Push workflow. It applies any prepared files
# placed under `.assistant/pending/` into the repository root. You can extend this
# script to run generators or other automated changes.

set -euo pipefail

PENDING_DIR=".assistant/pending"

echo "Assistant apply script starting"

if [ -d "$PENDING_DIR" ]; then
  shopt -s dotglob || true
  files=("$PENDING_DIR"/*)
  if [ ${#files[@]} -gt 0 ]; then
    echo "Applying files from $PENDING_DIR"
    for f in "$PENDING_DIR"/*; do
      dest="${f#$PENDING_DIR/}"
      echo " -> copying $f to $dest"
      mkdir -p "$(dirname "$dest")"
      cp -r "$f" "$dest"
    done
  else
    echo "No files in $PENDING_DIR"
  fi
else
  echo "$PENDING_DIR does not exist — nothing to apply"
fi

echo "Assistant apply script finished"
