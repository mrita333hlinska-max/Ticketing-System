# Driving the browser with Chrome DevTools MCP

A quick reference for asking Claude Code to inspect and manipulate a page through
the `chrome-devtools` MCP server.

## Before it works

The MCP server loads only when Claude Code **starts**. After adding it, fully
**quit and restart** Claude Code. Confirm it's connected with `/mcp` — you should
see `chrome-devtools` listed as connected. Until then, its tools aren't callable.

## How to ask

Just describe what you want in plain language (voice or typed) — Claude picks the
right DevTools tool. You don't need to name the tool. Examples:

### Navigation & page state

- "Open github.com in the browser."
- "Go back to the previous page."
- "Take a snapshot of the page so you know what's on it."
- "Screenshot the current page."

### Network (the Network tab)

- "Show me all the network requests this page made."
- "List only the requests to /api/\*."
- "What was the status and response body of the login request?"
- "Which requests failed or returned 4xx/5xx?"

### Console

- "Show me the console messages."
- "Are there any console errors on this page?"

### DOM & interaction

- "Click the 'Sign in' button."
- "Type my email into the email field."
- "Fill the login form and submit it."
- "What's the text of the first heading?"

### Run JavaScript (the DevTools console)

- "Run `document.title` and tell me the result."
- "Evaluate `localStorage.getItem('token')` on the page."
- "Scroll to the bottom and tell me how many cards loaded."

### Performance

- "Record a performance trace while the page loads and summarize it."
- "What are the slowest network requests?"

## Tips

- **You keep the visual DevTools panel.** Claude reads/manipulates the page over
  the DevTools Protocol; you can still press ⌥⌘I to watch the panel yourself on the
  same tab.
- **Be specific about the target** — "the Submit button in the header" beats
  "the button" when a page has several.
- **For our app**: "Open <http://localhost:8080>, log in, and show me the failed
  /api requests" is a great end-to-end debugging ask.
