# link-reader

An agent skill that reads a link and tells you what it actually says.

Most summarizers give you shorter text. This one gives you the claim, the frame underneath it, and whether it matters. X posts and threads route through the Grok xAI API with image and video understanding; everything else goes through Jina Reader with a direct-fetch fallback.

## Output shape

1. What it says
2. What it means
3. Why it matters
4. A take, only when it is useful

## Install

Copy the skill folder into your skills directory:

    cp -r skills/link-reader ~/.claude/skills/link-reader

Or install with the skills CLI:

    npx skills add soheilmomeniii/link-reader

## Usage

    node skills/link-reader/scripts/read-and-summarize.js <url>
    node skills/link-reader/scripts/read-and-summarize.js <url> --json

## Requirements

Node 18 or newer, and an xAI API key for the X route:

    export XAI_API_KEY=your-key

Non-X links work without a key through Jina Reader, but the summary step also calls Grok.

## What is in it

    skills/link-reader/
      SKILL.md                        routing, workflow, and the quality bar
      scripts/read-and-summarize.js   the reader itself

## License

MIT
