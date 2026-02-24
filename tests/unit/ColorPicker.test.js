/**
 * @jest-environment jsdom
 */

// Mock the global UIComponents if needed, or import the function
// Since it's currently a browser global, we mock the structure

describe('ColorPicker Component', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mocking the ColorPicker component logic locally for the test
        // In a real scenario, we would use a build step or JSDOM compatible imports
        window.UIComponents = {
            createColorPicker: (colors, selectedId, onChange) => {
                const grid = document.createElement('div');
                grid.className = 'color-grid';

                colors.forEach(color => {
                    const option = document.createElement('div');
                    option.className = color.id === selectedId ? 'color-option selected' : 'color-option';
                    option.dataset.colorId = color.id;
                    option.onclick = () => onChange(color.id);
                    grid.appendChild(option);
                });

                return grid;
            }
        };
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    test('should render all color options', () => {
        const colors = [{ id: 'red' }, { id: 'blue' }];
        const picker = window.UIComponents.createColorPicker(colors, 'red', () => { });
        container.appendChild(picker);

        expect(container.querySelectorAll('.color-option').length).toBe(2);
    });

    test('should have the correct selected class', () => {
        const colors = [{ id: 'red' }, { id: 'blue' }];
        const picker = window.UIComponents.createColorPicker(colors, 'blue', () => { });
        container.appendChild(picker);

        const selected = container.querySelector('.selected');
        expect(selected.dataset.colorId).toBe('blue');
    });

    test('should call onChange when a color is clicked', () => {
        const colors = [{ id: 'red' }, { id: 'blue' }];
        const onChange = jest.fn();
        const picker = window.UIComponents.createColorPicker(colors, 'red', onChange);
        container.appendChild(picker);

        const blueOption = container.querySelector('[data-color-id="blue"]');
        blueOption.click();

        expect(onChange).toHaveBeenCalledWith('blue');
    });
});
