Hi there,
I'm testing my personal project, which is a password manager browser extension. The goal is to display a small icon and a dropdown properly in both regular input fields and input fields inside iframes.

✅ What I'm trying to do:
Show an icon (a small blue marker) next to input fields.

When the icon is clicked, a dropdown should appear with saved credentials or credit card info.

The dropdown should be positioned exactly 4px below the input field and centered horizontally.

This behavior should work both inside iframes and in the main document.

❌ Problems I'm facing:
Icon and dropdown misalignment during scroll
On some websites, the icon and dropdown scroll with the entire viewport instead of staying anchored to the field.
On other sites, it works correctly. This inconsistency causes the UI to appear detached or misaligned when scrolling, especially in iframes.

Dropdown placement is sometimes off
Even without scrolling, the dropdown is not consistently aligned 4px below the field as expected. Sometimes it's fine; sometimes it's offset or detached from the field.

Cleanup not working when clicking the icon

I want the previous dropdown (if any) to be cleaned up or removed before opening a new one.

But currently, when I click the icon multiple times, multiple dropdowns open, and old ones don’t get destroyed.

This causes clutter and functional issues.

🔍 Additional info:
The icon (blue marker) is hidden in the screenshots due to my university’s privacy policy.

The files involved:

input-field-icon.ts — responsible for rendering the icon

autofill-dropdown.ts — responsible for managing and displaying the dropdown


🙏 What I'm looking for:
How to consistently anchor the icon and dropdown to the input field, even inside iframes and during scrolling.

How to ensure correct placement of the dropdown (4px below the field, horizontally centered).

How to properly clean up previous dropdowns before rendering a new one.

Any help or suggestions would be really appreciated. Thanks in advance!