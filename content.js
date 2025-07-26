// AI Hebrew RTL Extension - Smart RTL text alignment for Hebrew in AI chat platforms
class AIHebrewRTL {
    constructor() {
        this.isEnabled = true;
        this.alignmentMode = 'smart'; // 'smart', 'auto', 'force'
        this.supportedSites = {
            'claude.ai': {
                selectors: [
                    '[data-testid*="message"]',
                    '[class*="message"]',
                    'div[class*="prose"]',
                    'div[class*="markdown"]'
                ]
            },
            'chat.openai.com': {
                selectors: [
                    '[data-message-author-role]',
                    '.markdown',
                    '[class*="message"]',
                    '[data-testid*="conversation-turn"]'
                ]
            },
            'chatgpt.com': {
                selectors: [
                    '[data-message-author-role]',
                    '.markdown',
                    '[class*="message"]',
                    '[data-testid*="conversation-turn"]'
                ]
            },
            'gemini.google.com': {
                selectors: [
                    '[data-test-id*="conversation-turn"]',
                    '[class*="message"]',
                    '.markdown',
                    '[role="presentation"]'
                ]
            },
            'perplexity.ai': {
                selectors: [
                    '[class*="message"]',
                    '.prose',
                    '[role="presentation"]'
                ]
            },
            'poe.com': {
                selectors: [
                    '[class*="Message"]',
                    '[class*="message"]'
                ]
            },
            'character.ai': {
                selectors: [
                    '[class*="message"]',
                    '[data-testid*="message"]'
                ]
            },
            'you.com': {
                selectors: [
                    '[class*="message"]',
                    '[data-testid*="message"]'
                ]
            }
        };
        this.init();
    }

    init() {
        // Load settings
        this.loadSettings();

        // Observe DOM changes
        this.observeChanges();

        // Process existing messages
        this.processExistingMessages();

        // Listen for popup messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                this.isEnabled = request.enabled;
                this.toggleRTL();
            }
            if (request.action === 'setMode') {
                this.alignmentMode = request.mode;
                this.processExistingMessages();
            }
        });
    }

    loadSettings() {
        chrome.storage.sync.get(['hebrewRTLEnabled', 'alignmentMode'], (result) => {
            this.isEnabled = result.hebrewRTLEnabled !== false; // default true
            this.alignmentMode = result.alignmentMode || 'smart'; // default smart
        });
    }

    // Get current site configuration
    getCurrentSiteConfig() {
        const hostname = window.location.hostname;
        for (const [site, config] of Object.entries(this.supportedSites)) {
            if (hostname.includes(site)) {
                return config;
            }
        }
        // Fallback for unknown sites
        return {
            selectors: [
                '[data-testid*="message"]',
                '[class*="message"]',
                '.markdown',
                '.prose'
            ]
        };
    }

    // Check if text contains Hebrew characters
    hasHebrew(text) {
        const hebrewRegex = /[\u0590-\u05FF]/;
        return hebrewRegex.test(text);
    }

    // Check if text starts with Hebrew (for smart alignment)
    startsWithHebrew(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;

        // Skip punctuation at the beginning
        const firstLetter = trimmed.match(/[\u0590-\u05FF\u0041-\u005A\u0061-\u007A]/);
        if (!firstLetter) return false;

        return /[\u0590-\u05FF]/.test(firstLetter[0]);
    }

    // Check if text starts with English (for smart alignment)
    startsWithEnglish(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;

        // Skip punctuation at the beginning
        const firstLetter = trimmed.match(/[\u0590-\u05FF\u0041-\u005A\u0061-\u007A]/);
        if (!firstLetter) return false;

        return /[\u0041-\u005A\u0061-\u007A]/.test(firstLetter[0]);
    }

    // Calculate Hebrew percentage in text
    getHebrewPercentage(text) {
        const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
        const totalChars = text.replace(/\s/g, '').length;
        return totalChars > 0 ? (hebrewChars / totalChars) * 100 : 0;
    }

    // Determine if text should be RTL based on alignment mode
    shouldBeRTL(text) {
        if (!this.hasHebrew(text)) return false;

        switch (this.alignmentMode) {
            case 'smart':
                // Align based on first meaningful character
                if (this.startsWithHebrew(text)) return true;
                if (this.startsWithEnglish(text)) return false;
                // Fallback to percentage if unclear
                return this.getHebrewPercentage(text) > 50;

            case 'auto':
                // Align based on Hebrew percentage (30% threshold)
                const hebrewPercentage = this.getHebrewPercentage(text);
                return hebrewPercentage > 30 || this.startsWithHebrew(text);

            case 'force':
                // Force RTL for any text containing Hebrew
                return true;

            default:
                return this.getHebrewPercentage(text) > 30;
        }
    }

    // Check if element is or contains code
    isCodeElement(element) {
        const codeSelectors = [
            'pre', 'code', '.highlight', '.language-', '[class*="language-"]',
            '[class*="hljs"]', '.code-block', '[data-language]', '.markdown pre',
            '.cm-editor', '.monaco-editor', '[class*="prism"]', '.syntax-highlight'
        ];

        // Check if element itself is a code element
        for (const selector of codeSelectors) {
            try {
                if (element.matches(selector)) return true;
                if (element.querySelector(selector)) return true;
            } catch (e) {
                // Handle invalid selectors gracefully
            }
        }

        // Check by class name patterns
        const className = element.className || '';
        if (className.includes('code') || className.includes('highlight') ||
            className.includes('language-') || className.includes('hljs')) {
            return true;
        }

        // Check for common code patterns in text content
        const textContent = element.textContent || '';
        const codePatterns = [
            /^(\s*)?(function|const|let|var|class|import|export|if|for|while|def|public|private)\s+/,
            /^\s*[<>{}[\]();.,\-+=*\/\\|&!@#$%^&*]+\s*$/,
            /^\s*\/\*[\s\S]*?\*\/\s*$/, // CSS/JS comments
            /^\s*\/\/.*$/, // Single line comments
            /^\s*#.*$/, // Python/Shell comments
            /^(\s*)<\/?[a-zA-Z][^>]*>/m, // HTML tags
            /^\s*\w+\s*[:=]\s*['"`]/, // Property definitions
            /^\s*\$\w+/, // Variables starting with $
            /^\s*@\w+/, // Decorators/annotations
        ];

        // Short text that looks like code
        if (textContent.length < 100) {
            return codePatterns.some(pattern => pattern.test(textContent));
        }

        return false;
    }

    // Check if element should be forced LTR (code, numbers, etc.)
    shouldBeForcedLTR(element) {
        // Always LTR for code elements
        if (this.isCodeElement(element)) return true;

        // Check for mathematical expressions
        const textContent = element.textContent || '';
        const mathPatterns = [
            /^\s*[\d\+\-\*\/\=\(\)\.\,\s]+$/, // Simple math
            /^\s*\d+[\.\,]\d+/, // Decimal numbers
            /^\s*[\d\s\+\-\*\/\=\(\)]+$/, // Math expressions
        ];

        if (textContent.length < 50 && mathPatterns.some(pattern => pattern.test(textContent))) {
            return true;
        }

        return false;
    }

    // Process a single message element
    processMessage(element) {
        if (!this.isEnabled) return;

        // Handle code elements separately - they should always be LTR
        this.processCodeElements(element);

        // Force LTR for specific elements (like math expressions)
        if (this.shouldBeForcedLTR(element)) {
            element.classList.remove('hebrew-rtl');
            element.classList.add('force-ltr');
            element.setAttribute('dir', 'ltr');
            return;
        }

        // Process individual paragraphs and text blocks within the message
        this.processParagraphs(element);
    }

    // Process individual paragraphs for line-by-line RTL detection
    processParagraphs(parentElement) {
        // Find all paragraph-like elements within the message
        const textElements = [
            ...parentElement.querySelectorAll('p, div, span, li, h1, h2, h3, h4, h5, h6'),
            parentElement // Include the parent element itself
        ];

        textElements.forEach(element => {
            // Skip if this element is a code element
            if (this.isCodeElement(element) || this.shouldBeForcedLTR(element)) {
                element.classList.remove('hebrew-rtl');
                element.classList.add('force-ltr');
                element.setAttribute('dir', 'ltr');
                return;
            }

            // Get only the direct text content of this element (not nested elements)
            const directText = this.getDirectTextContent(element);

            // Skip elements with no direct text content
            if (!directText || !directText.trim()) {
                return;
            }

            // Apply RTL/LTR based on first word only
            if (this.shouldBeRTLByFirstWord(directText)) {
                element.classList.add('hebrew-rtl');
                element.classList.remove('force-ltr');
                element.setAttribute('dir', 'rtl');
            } else {
                element.classList.remove('hebrew-rtl');
                element.classList.remove('force-ltr');
                element.setAttribute('dir', 'ltr');
            }
        });
    }

    // Get direct text content of element (excluding nested elements)
    getDirectTextContent(element) {
        let text = '';
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        }
        return text;
    }

    // Determine RTL alignment based on first meaningful word only
    shouldBeRTLByFirstWord(text) {
        if (!this.hasHebrew(text)) return false;

        const trimmed = text.trim();
        if (!trimmed) return false;

        // Find the first meaningful word (skip punctuation and spaces)
        const firstWordMatch = trimmed.match(/^[\s\p{P}]*(\p{L}+)/u);
        if (!firstWordMatch) return false;

        const firstWord = firstWordMatch[1];

        // Check if the first word contains Hebrew characters
        return /[\u0590-\u05FF]/.test(firstWord);
    }

    // Process code elements within a message
    processCodeElements(parentElement) {
        const codeSelectors = [
            'pre', 'code', '.highlight', '[class*="language-"]', '[class*="hljs"]',
            '.code-block', '[data-language]', '.cm-editor', '.monaco-editor',
            '[class*="prism"]', '.syntax-highlight'
        ];

        codeSelectors.forEach(selector => {
            try {
                const codeElements = parentElement.querySelectorAll(selector);
                codeElements.forEach(codeEl => {
                    codeEl.classList.remove('hebrew-rtl');
                    codeEl.classList.add('force-ltr');
                    codeEl.setAttribute('dir', 'ltr');

                    // Also handle nested elements within code blocks
                    const nestedElements = codeEl.querySelectorAll('*');
                    nestedElements.forEach(nested => {
                        nested.classList.remove('hebrew-rtl');
                        nested.setAttribute('dir', 'ltr');
                    });
                });
            } catch (e) {
                // Handle invalid selectors gracefully
            }
        });

        // Handle inline code elements specially
        const inlineCodeElements = parentElement.querySelectorAll('code:not(pre code)');
        inlineCodeElements.forEach(inlineCode => {
            inlineCode.classList.remove('hebrew-rtl');
            inlineCode.classList.add('force-ltr');
            inlineCode.setAttribute('dir', 'ltr');
        });
    }

    // Process all existing messages on the page
    processExistingMessages() {
        const siteConfig = this.getCurrentSiteConfig();

        siteConfig.selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Check if element contains text (not just children)
                if (element.textContent && element.textContent.trim()) {
                    this.processMessage(element);
                }
            });
        });
    }

    // Observe DOM changes for dynamic content
    observeChanges() {
        const siteConfig = this.getCurrentSiteConfig();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Handle new nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is a message
                        if (node.textContent && node.textContent.trim()) {
                            this.processMessage(node);
                        }

                        // Find messages within the node
                        siteConfig.selectors.forEach(selector => {
                            try {
                                const messages = node.querySelectorAll(selector);
                                messages.forEach(message => {
                                    if (message.textContent && message.textContent.trim()) {
                                        this.processMessage(message);
                                    }
                                });
                            } catch (e) {
                                // Handle invalid selectors gracefully
                                console.debug('AI Hebrew RTL: Invalid selector', selector);
                            }
                        });
                    }
                });

                // Handle content changes in existing elements
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const target = mutation.target;
                    let messageElement = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;

                    // Find the closest message element
                    let attempts = 0;
                    while (messageElement && attempts < 10) {
                        let isMessage = false;
                        siteConfig.selectors.forEach(selector => {
                            try {
                                if (messageElement.matches && messageElement.matches(selector)) {
                                    isMessage = true;
                                }
                            } catch (e) {
                                // Handle invalid selectors gracefully
                            }
                        });

                        if (isMessage) break;
                        messageElement = messageElement.parentElement;
                        attempts++;
                    }

                    if (messageElement && messageElement.textContent && messageElement.textContent.trim()) {
                        this.processMessage(messageElement);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Toggle RTL functionality on/off
    toggleRTL() {
        if (this.isEnabled) {
            this.processExistingMessages();
        } else {
            // Remove all RTL styling
            const rtlElements = document.querySelectorAll('.hebrew-rtl, .force-ltr');
            rtlElements.forEach(element => {
                element.classList.remove('hebrew-rtl', 'force-ltr');
                element.removeAttribute('dir');
            });
        }

        // Save settings
        chrome.storage.sync.set({
            hebrewRTLEnabled: this.isEnabled,
            alignmentMode: this.alignmentMode
        });
    }
}

// Initialize the extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AIHebrewRTL();
    });
} else {
    new AIHebrewRTL();
}