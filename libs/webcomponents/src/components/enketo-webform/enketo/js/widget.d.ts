export default Widget;
/**
 * A Widget class that can be extended to provide some of the basic widget functionality out of the box.
 */
declare class Widget {
    /**
     * Returns its own name.
     *
     * @static
     * @readonly
     * @type {string}
     */
    static readonly get name(): string;
    /**
     * Returns true if the widget is using a list of options.
     *
     * @readonly
     * @static
     * @type {boolean}
     */
    static readonly get list(): boolean;
    /**
     * Tests whether widget needs to be instantiated (e.g. if not to be used for touchscreens).
     * Note that the Element (used in the constructor) will be provided as parameter.
     *
     * @static
     * @return {boolean} to instantiate or not to instantiate, that is the question
     */
    static condition(): boolean;
    /**
     * @class
     * @param {Element} element - The DOM element the widget is applied on
     * @param {(boolean|{touch: boolean})} [options] - Options passed to the widget during instantiation
     */
    constructor(element: Element, options?: boolean | {
        touch: boolean;
    } | undefined);
    element: Element;
    options: {};
    question: Element | null;
    _props: object;
    /**
     * Meant to be overridden, but automatically called.
     *
     */
    _init(): void;
    /**
     * Sets a value in the widget. Should be overridden.
     *
     * @param {*} value - value to set
     * @type {*}
     */
    readonly set value(arg: any);
    /**
     * Obtains the value from the current widget state. Should be overridden.
     *
     * @readonly
     * @type {*}
     */
    readonly get value(): any;
    /**
     * Not meant to be overridden, but could be. Recommend to extend `get props()` instead.
     *
     * @return {object} props object
     */
    _getProps(): object;
    /**
     * Disallow user input into widget by making it readonly.
     */
    disable(): void;
    /**
     * Performs opposite action of disable() function.
     */
    enable(): void;
    /**
     * Updates form-defined language strings, <option>s (cascading selects, and (calculated) values.
     * Most of the times, this function needs to be overridden in the widget.
     */
    update(): void;
    /**
     * Returns widget properties. May need to be extended.
     *
     * @readonly
     * @type {object}
     */
    readonly get props(): object;
    /**
     * Returns a HTML document fragment for a reset button.
     *
     * @readonly
     * @type {Element}
     */
    readonly get resetButtonHtml(): Element;
    /**
     * Returns a HTML document fragment for a download button.
     *
     * @readonly
     * @type {Element}
     */
    readonly get downloadButtonHtml(): Element;
    /**
     * Updates the value in the original form control the widget is instantiated on.
     * This form control is often hidden by the widget.
     *
     * @param {*} value - value to set
     * @type {*}
     */
    readonly set originalInputValue(arg: any);
    /**
     * Obtains the value from the original form control the widget is instantiated on.
     * This form control is often hidden by the widget.
     *
     * @readonly
     * @type {*}
     */
    readonly get originalInputValue(): any;
}
