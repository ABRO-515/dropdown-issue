
export type AutofillCallback = (targetField: HTMLImageElement | null) => void;
const floatingIcons = new Map<HTMLInputElement, HTMLImageElement>();

export async function showFloatingIcon(input: HTMLInputElement, iconUrl: string, onClick: AutofillCallback) {
    if (floatingIcons.has(input)) {
        floatingIcons.get(input)!.remove();
        floatingIcons.delete(input);
    }
    const icon = document.createElement('img');
    // Use the provided iconUrl if available, otherwise fall back to the default extension icon
    // Replace 'YOUR_CUSTOM_ICON_URL' with your actual image URL or path
    icon.src = iconUrl || 'https://cdn.pixabay.com/photo/2024/02/12/16/05/siguniang-mountain-8568913_1280.jpg' || browser.runtime.getURL('base.png');
    icon.title = 'Autofill';
    icon.style.position = 'absolute';
    icon.style.zIndex = '2147483647'; // Maximum z-index
    icon.style.border = 'none';
    icon.style.cursor = 'pointer';
    icon.style.height = input.clientHeight - 10 + 'px';
    icon.style.maxHeight = '30px';
    icon.style.transform = 'translateY(-50%)';
    icon.style.padding = '2px';
    icon.className = 'floating-autofill-icon';

    document.body.appendChild(icon);
    floatingIcons.set(input, icon);

    const updatePosition = () => {
        const rect = input.getBoundingClientRect();
        const iconWidth = icon.offsetWidth || 20;
        icon.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;
        icon.style.left = `${rect.left + window.scrollX + rect.width - iconWidth - 6}px`;
    };

    icon.onload = () => updatePosition();

    const mutationObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
            if (
                mutation.type === 'attributes' &&
                (mutation.attributeName === 'style' || mutation.attributeName === 'class')
            ) {
                shouldUpdate = true;
            } else if (mutation.type === 'childList') {
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            updatePosition();
        }
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
    });

    icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(icon);
    });

    window.addEventListener('resize', () => updatePosition());
    window.addEventListener('scroll', () => updatePosition());
}
