/**
 * Draggable Navigation Bar
 * Allows the .quick-nav element to be moved around the screen.
 */

document.addEventListener('DOMContentLoaded', () => {
    initDraggableNav();
});

function initDraggableNav() {
    const nav = document.querySelector('.quick-nav');
    if (!nav) return;

    // State
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
        // Allow clicking links inside
        if (e.target.closest('a')) return;

        e.preventDefault();
        // Get mouse cursor position at start:
        pos3 = e.clientX || e.touches[0].clientX;
        pos4 = e.clientY || e.touches[0].clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Touch events
        document.addEventListener('touchend', closeDragElement, { passive: false });
        document.addEventListener('touchmove', elementDrag, { passive: false });
    };

    const elementDrag = (e) => {
        e.preventDefault();
        // Calculate new cursor position:
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // Calculate new element position
        // We use offsetTop/Left which is relative to offsetParent. 
        // For fixed elements, this is the viewport.
        let newTop = nav.offsetTop - pos2;
        let newLeft = nav.offsetLeft - pos1;

        // Boundaries
        const maxW = window.innerWidth - nav.offsetWidth;
        const maxH = window.innerHeight - nav.offsetHeight;

        newTop = Math.max(0, Math.min(newTop, maxH));
        newLeft = Math.max(0, Math.min(newLeft, maxW));

        // Apply
        nav.style.top = newTop + "px";
        nav.style.left = newLeft + "px";

        // Unset bottom/right so top/left takes precedence
        nav.style.bottom = 'auto';
        nav.style.right = 'auto';
    };

    const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
    };

    // Attach handler
    nav.addEventListener('mousedown', dragMouseDown);
    nav.addEventListener('touchstart', dragMouseDown, { passive: false });

    // Cursor hint
    nav.style.cursor = 'move';
}
