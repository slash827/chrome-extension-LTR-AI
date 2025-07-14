# AI Hebrew RTL Extension

Smart RTL text alignment extension for Hebrew text in AI chat platforms.

## Features

- **Smart Detection**: Automatically detects Hebrew text and aligns it RTL
- **Multiple Alignment Modes**: 
  - **Smart**: Aligns based on first meaningful word (Hebrew right, English left)
  - **Auto**: Aligns based on Hebrew percentage (30% threshold)
  - **Force**: Forces RTL for any text containing Hebrew
- **Mixed Text Support**: Handles Hebrew-English mixed content intelligently
- **Multi-Platform**: Works on ChatGPT, Claude, Gemini, Perplexity, and more
- **Toggle Control**: Easy on/off switch
- **Performance**: Lightweight with no impact on browser speed
- **Privacy**: All code runs locally, no data sent externally

## Supported Platforms

- Claude AI (claude.ai)
- ChatGPT (chat.openai.com, chatgpt.com)
- Google Gemini (gemini.google.com)
- Perplexity AI (perplexity.ai)
- Poe (poe.com)
- Character.AI (character.ai)
- You.com (you.com)

## Installation

1. Download all files to a folder on your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder with the files
5. The extension will appear in your extensions list

## Required Files

- `manifest.json` - Extension configuration
- `content.js` - Main logic
- `styles.css` - RTL styling
- `popup.html` - User interface
- `README.md` - This document

## How It Works

### Smart Mode (Recommended)
- Checks the first meaningful word in the text
- If it starts with Hebrew → aligns right
- If it starts with English → aligns left
- Fallback to percentage if unclear

### Auto Mode
- Calculates Hebrew percentage in text
- If >30% Hebrew OR starts with Hebrew → aligns right
- Otherwise → aligns left

### Force Mode
- Any text containing Hebrew characters → aligns right
- Useful for heavily mixed content

## Configuration

- Click the extension icon in the toolbar
- Use the toggle to enable/disable
- Select alignment mode from dropdown
- Settings are saved automatically

## Technical Support

The extension handles:
- Regular Hebrew text
- Mixed Hebrew-English text
- Numbered lists
- Blockquotes
- Links
- Tables
- Dynamic content updates

## Development

Built with:
- **JavaScript** - Core logic
- **CSS** - RTL styling
- **HTML** - User interface
- **Chrome Extensions API V3** - Browser integration

## Adding New Sites

To add support for new AI platforms, update the `supportedSites` object in `content.js`:

```javascript
'newsite.com': {
  selectors: [
    '[class*="message"]',
    '[data-testid*="chat"]'
  ]
}
```

## License

Open source - free to modify and distribute.

## Contact

Created for educational and portfolio development purposes.

---

**Important Notes:**
- Works on supported AI chat platforms
- Requires Chrome/Edge version 88+
- No personal data collected
- All code runs locally in browser