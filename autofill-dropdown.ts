let currentPopup: HTMLDivElement | null = null;
let focusListener: ((event: FocusEvent) => void) | null = null;

export interface DropdownEntry {
    label: string;
    subLabel?: string;
    icon?: string;
    values: { [key: string]: string };
}

type OnItemClick = (entry: DropdownEntry) => void;

interface DropdownMessage {
    type: 'createDropdown';
    anchorRect: DOMRect;
    entries: DropdownEntry[];
    iframeOffset: { x: number; y: number };
}

const css = `
    .autofill-dropdown {
        position: absolute;
        background: linear-gradient(135deg,rgb(13, 75, 168) 0%,rgb(70, 173, 165) 100%);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-radius: 12px;
        max-height: 300px;
        overflow-y: auto;
        width: min(250px, 90vw);
        padding: 0.5rem;
        font-family: inherit;
        z-index: 2147483647;
        border: 1px solidrgb(83, 28, 73);
        transition: all 0.2s ease-in-out;
    }

    .dropdown-row {
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s;
        gap: 0.75rem;
        margin-left: 0
    }

    .dropdown-row:hover {
        background-color:rgb(89, 126, 164);
        border-radius: 8px;
    }

    .dropdown-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        fill:rgb(49, 48, 46);
    }

    .dropdown-labels {
        display: flex;
        flex-direction: column;
    }

    .dropdown-label {
        font-weight: 400;
        font-size: 16px;
        color:rgb(114, 143, 46);
    }

    .dropdown-sub-label {
        font-size: 14px;
        color: #4a607c;
    }

    .dropdown-header {
        padding: 10px 16px;
        font-size: 14px;
        color:rgb(113, 118, 128);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solidrgba(19, 100, 24, 0.4);
    }

    .dropdown-header span {
        display: flex;
        align-items: center;
    }

    .close-btn {
        cursor: pointer;
        font-size: 18px;
        color:rgb(95, 74, 77);
    }
`;

function cleanupPopup() {
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
    }
    
    // Also send cleanup message for iframe case
    if (window.top !== window.self) {
        window.top?.postMessage({ type: 'cleanupDropdown' }, '*');
    }
}

function getIframeOffset(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    let currentWindow = window;
    while (currentWindow !== window.top && currentWindow.frameElement) {
        const rect = currentWindow.frameElement.getBoundingClientRect();
        x += rect.left + currentWindow.scrollX;
        y += rect.top + currentWindow.scrollY;
        currentWindow = currentWindow.parent.window;
    }
    return { x, y };
}

export function toggleAutofillPopup(
    anchorInput: HTMLInputElement,
    entries: DropdownEntry[],
    onItemClick?: OnItemClick,
    icon: HTMLImageElement | null = null
) {
    // Always cleanup any existing popup first
    cleanupPopup();
    
    // Remove any existing focus listener
    if (focusListener) {
        anchorInput.removeEventListener('focus', focusListener);
        focusListener = null;
    }

    const isInsideIframe = window.top !== window.self;

    if (isInsideIframe) {
        const rect = anchorInput.getBoundingClientRect();
        const iframeOffset = getIframeOffset();
        window.top?.postMessage(
            {
                type: 'createDropdown',
                anchorRect: {
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom + window.scrollY,
                    right: rect.right + window.scrollX,
                    x: rect.x + window.scrollX,
                    y: rect.y + window.scrollY,
                },
                entries,
                iframeOffset,
            } as DropdownMessage,
            '*'
        );
    } else {
        currentPopup = createDropdownAutofillPopup(anchorInput, entries, (entry) => {
            onItemClick?.(entry);
            cleanupPopup();
        }, icon);
    }

    // Set up focus listener to recreate dropdown when input gets focus again
    focusListener = () => {
        if (!currentPopup) {
            toggleAutofillPopup(anchorInput, entries, onItemClick, icon);
        }
    };
    anchorInput.addEventListener('focus', focusListener);
}

export function createDropdownAutofillPopup(
    anchorInput: HTMLInputElement,
    entries: DropdownEntry[],
    onItemClick?: OnItemClick,
    icon: HTMLImageElement | null = null,
    iframeOffset: { x: number; y: number } = { x: 0, y: 0 }
): HTMLDivElement {
    if (!document.querySelector('style[data-dropdown-css]')) {
        const style = document.createElement('style');
        style.setAttribute('data-dropdown-css', 'true');
        document.head.appendChild(style);
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
    }

    const popup = document.createElement('div');
    popup.className = 'autofill-dropdown';
    popup.style.zIndex = '2147483647';

    const updatePosition = () => {
        const rect = anchorInput.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        popup.style.top = `${rect.bottom + scrollTop + iframeOffset.y + 4}px`;
        popup.style.left = `${rect.left + scrollLeft + iframeOffset.x}px`;
        popup.style.width = `${rect.width}px`;
    };
    updatePosition();

    if (entries.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No saved items to autofill.';
        emptyMsg.style.padding = '12px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#4a607c';
        emptyMsg.style.fontSize = '16px';
        popup.appendChild(emptyMsg);
    } else {
        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.margin = '0';
        list.style.padding = '0';

        entries.forEach((entry) => {
            const item = document.createElement('li');
            item.className = 'dropdown-row';
            item.innerHTML = `
                <div class="dropdown-icon">${entry.icon ?? ''}</div>
                <div class="dropdown-labels">
                    <div class="dropdown-label">${entry.label}</div>
                    ${entry.subLabel ? `<div class="dropdown-sub-label">${entry.subLabel}</div>` : ''}
                </div>
            `;
            item.addEventListener('click', () => {
                if (onItemClick) {
                    onItemClick(entry);
                    if (window.top !== window.self) {
                        window.top?.postMessage(
                            {
                                type: 'fillDropdownEntry',
                                entry,
                            },
                            '*'
                        );
                    }
                }
                cleanup();
            });
            list.appendChild(item);
        });

        popup.appendChild(list);
    }

    const clickOutsideHandler = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!popup.contains(target) && !anchorInput.contains(target) && target !== anchorInput && target !== icon) {
            cleanup();
        }
    };

    const handleResizeOrScroll = () => {
        updatePosition();
    };

    const cleanup = () => {
        popup.remove();
        document.removeEventListener('click', clickOutsideHandler, true);
        window.removeEventListener('resize', handleResizeOrScroll);
        window.removeEventListener('scroll', handleResizeOrScroll, true);// CHANGE THIS LINE
        if (window.top !== window.self) {
            window.top?.postMessage({ type: 'cleanupDropdown' }, '*');
        }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    
    document.addEventListener('click', clickOutsideHandler, true);
    document.body.appendChild(popup);
    return popup;
}

export function showUnlockDropdown(anchorInput: HTMLInputElement) {
    const unlockContainer = document.createElement('div');
    unlockContainer.style.padding = '15px 0';
    unlockContainer.style.background = '#fff';
    unlockContainer.style.border = '1px solid #ccc';
    unlockContainer.style.borderRadius = '6px';
    unlockContainer.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    unlockContainer.style.zIndex = '999999';
    unlockContainer.style.minWidth = '240px';
    unlockContainer.style.fontFamily = 'inherit';
    unlockContainer.style.position = 'absolute';
    unlockContainer.style.textAlign = 'center';

    const isInsideIframe = window.top !== window.self;
    if (isInsideIframe) {
        unlockContainer.style.maxHeight = `${window.innerHeight - 80}px`;
    }

    const updatePosition = () => {
        const rect = anchorInput.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        unlockContainer.style.top = `${rect.bottom + scrollTop}px`;
        unlockContainer.style.left = `${rect.left + scrollLeft}px`;
        unlockContainer.style.width = `${rect.width}px`;
    };

    updatePosition();

    const message = document.createElement('div');
    message.textContent = '🔒 Unlock Apna Bhai to autofill your saved logins.';
    message.style.marginBottom = '12px';
    message.style.fontSize = '16px';
    message.style.color = '#5f6368';
    message.style.whiteSpace = 'normal';
    message.style.wordBreak = 'break-word';

    const unlockBtn = document.createElement('button');
    unlockBtn.textContent = 'Unlock Apna Bhai';
    unlockBtn.style.fontFamily = 'inherit';
    unlockBtn.style.cssText = `
        background-color:rgb(123, 129, 128); color: white; border: none; padding: 8px 16px;
        border-radius: 4px; font-size: 14px; cursor: pointer; font-weight: 600;
    `;
    unlockBtn.onmouseover = () => unlockBtn.style.backgroundColor = '#29aa9d';
    unlockBtn.onmouseout = () => unlockBtn.style.backgroundColor = '#2ec4b6';

    unlockBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'openSidePanel' });
        cleanup();
    });

    unlockContainer.appendChild(message);
    unlockContainer.appendChild(unlockBtn);
    document.body.appendChild(unlockContainer);

    const clickOutsideHandler = (event: MouseEvent) => {
        if (!unlockContainer.contains(event.target as Node) && event.target !== anchorInput) {
            cleanup();
        }
    };

    const handleResizeOrScroll = () => {
        updatePosition();
    };

    const cleanup = () => {
        unlockContainer.remove();
        document.removeEventListener('click', clickOutsideHandler, true);
        window.removeEventListener('resize', handleResizeOrScroll);
        
    };

    window.addEventListener('resize', handleResizeOrScroll);
    
    document.addEventListener('click', clickOutsideHandler, true);

    chrome.runtime.sendMessage({ type: 'findCommandKey', payload: { commandName: 'toggle-sidebar' } })
        .then((res) => {
            const shortcut = res?.shortcut;
            if (shortcut) {
                const shortcutTip = document.createElement('div');
                shortcutTip.textContent = `💡 Tip: You can also press ${shortcut} to open Apna Bhai.`;
                shortcutTip.style.marginTop = '12px';
                shortcutTip.style.fontSize = '14px';
                shortcutTip.style.color = '#888';
                shortcutTip.style.whiteSpace = 'normal';
                shortcutTip.style.wordBreak = 'break-word';
                unlockContainer.appendChild(shortcutTip);
            }
        })
        .catch((err) => {
            console.error("Failed to get shortcut:", err);
        });
}
