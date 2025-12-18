#!/bin/bash

# Quick Git Update Script
# Usage: ./git-update.sh "Your commit message"

# Check if commit message is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./git-update.sh \"Your commit message\""
    exit 1
fi

echo "📝 Checking status..."
git status

echo ""
echo "➕ Adding changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "$1"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Your changes are now on GitHub!"
