// HACK - copied from shared type-def as could not resolve globals
type ExternalInstance = {
  id: string;
  src: string;
  xml: string | Document;
};
type FormDataObj = {
  /**
   * -  XML Model as string
   */
  modelStr: string;
  /**
   * - (partial) XML instance to load
   */
  instanceStr?: string | undefined;
  /**
   * - Flag to indicate whether data was submitted before
   */
  submitted?: boolean | undefined;
  /**
   * - Array of external data objects, required for each external data instance in the XForm
   */
  external?: (ExternalInstance | null | undefined)[] | undefined;
  /**
   * - ID of external instance
   */
  id?: string | undefined;
  /**
   * - XML string of external instance content
   */
  xmlStr?: string | undefined;
};
type UpdatedDataNodes = any;
type jQuery = object;

export type FormOptions = {
  /**
   * Overrides the default languages rules of the XForm itself. Pass any valid and present-in-the-form IANA subtag string, e.g. `ar`.
   */
  language?: string | undefined;
  /**
   * If `printRelevantOnly` is set to `true`
   * or not set at all, printing the form only includes what is visible, ie. all the
   * groups and questions that do not have a `relevant` expression or for which the
   * expression evaluates to `true`.
   */
  printRelevantOnly?: boolean | undefined;
};
export type ValidateInputResolution = {
  requiredValid: boolean;
  constraintValid: boolean;
};
/**
 * @typedef FormOptions
 * @property {string} [language] Overrides the default languages rules of the XForm itself. Pass any valid and present-in-the-form IANA subtag string, e.g. `ar`.
 * @property {boolean} [printRelevantOnly] If `printRelevantOnly` is set to `true`
 *   or not set at all, printing the form only includes what is visible, ie. all the
 *   groups and questions that do not have a `relevant` expression or for which the
 *   expression evaluates to `true`.
 */
/**
 * Class: Form
 *
 * Most methods are prototype method to facilitate customizations outside of enketo-core.
 *
 * @param {Element} formEl - HTML form element (a product of Enketo Transformer after transforming a valid ODK XForm)
 * @param {FormDataObj} data - Data object containing XML model, (partial) XML instance-to-load, external data and flag about whether instance-to-load has already been submitted before.
 * @param {FormOptions} [options]
 * @class
 */
export function Form(
  formEl: Element,
  data: FormDataObj,
  options?: FormOptions | undefined
): Form;
export class Form {
  /**
   * @typedef FormOptions
   * @property {string} [language] Overrides the default languages rules of the XForm itself. Pass any valid and present-in-the-form IANA subtag string, e.g. `ar`.
   * @property {boolean} [printRelevantOnly] If `printRelevantOnly` is set to `true`
   *   or not set at all, printing the form only includes what is visible, ie. all the
   *   groups and questions that do not have a `relevant` expression or for which the
   *   expression evaluates to `true`.
   */
  /**
   * Class: Form
   *
   * Most methods are prototype method to facilitate customizations outside of enketo-core.
   *
   * @param {Element} formEl - HTML form element (a product of Enketo Transformer after transforming a valid ODK XForm)
   * @param {FormDataObj} data - Data object containing XML model, (partial) XML instance-to-load, external data and flag about whether instance-to-load has already been submitted before.
   * @param {FormOptions} [options]
   * @class
   */
  constructor(
    formEl: Element,
    data: FormDataObj,
    options?: FormOptions | undefined
  );
  nonRepeats: {};
  all: {};
  options: FormOptions;
  view: {
    $: any;
    html: Element;
    clone: Node;
  };
  model: any;
  repeatsPresent: boolean;
  widgetsInitialized: boolean;
  repeatsInitialized: boolean;
  pageNavigationBlocked: boolean;
  initialized: boolean;
  /**
   * Returns a module and adds the form property to it.
   *
   * @param {object} module - Enketo Core module
   * @return {object} updated module
   */
  addModule(module: object): object;
  /**
   * Function: init
   *
   * Initializes the Form instance (XML Model and HTML View).
   *
   * @return {Array<string>} List of initialization errors.
   */
  init(): Array<string>;
  toc: object | undefined;
  pages: object | undefined;
  langs: object | undefined;
  progress: object | undefined;
  widgets: object | undefined;
  preloads: object | undefined;
  relevant: object | undefined;
  repeats: object | undefined;
  input: object | undefined;
  output: object | undefined;
  itemset: object | undefined;
  calc: object | undefined;
  required: object | undefined;
  mask: object | undefined;
  readonly: object | undefined;
  repeatPathPrefixes: string[] | null;
  set editStatus(arg: boolean);
  /**
   * @type {boolean}
   */
  get editStatus(): boolean;
  /**
   * @param {string} xpath - simple path to question
   * @return {Array<string>} A list of errors originated from `goToTarget`. Empty if everything went fine.
   */
  goTo(xpath: string): Array<string>;
  /**
   * Obtains a string of primary instance.
   *
   * @param {{include: boolean}} [include] - Optional object items to exclude if false
   * @return {string} XML string of primary instance
   */
  getDataStr(
    include?:
      | {
          include: boolean;
        }
      | undefined
  ): string;
  /**
   * Restores HTML form to pre-initialized state. It is meant to be called before re-initializing with
   * new Form ( .....) and form.init()
   * For this reason, it does not fix event handler, $form, formView.$ etc.!
   * It also does not affect the XML instance!
   *
   * @return {Element} the new form element
   */
  resetView(): Element;
  /**
   * Implements jr:choice-name
   * TODO: this needs to work for all expressions (relevants, constraints), now it only works for calculated items
   * Ideally this belongs in the form Model, but unfortunately it needs access to the view
   *
   * @param {string} expr - XPath expression
   * @param {string} resTypeStr - type of result
   * @param {string} context - context path
   * @param {number} index - index of context
   * @param {boolean} tryNative - whether to try the native evaluator, i.e. if there is no risk it would create an incorrect result such as with date comparisons
   * @return {string} updated expression
   */
  replaceChoiceNameFn(
    expr: string,
    resTypeStr: string,
    context: string,
    index: number,
    tryNative: boolean
  ): string;
  /**
   * Uses current state of model to set all the values in the form.
   * Since not all data nodes with a value have a corresponding input element,
   * we cycle through the HTML form elements and check for each form element whether data is available.
   *
   * @param {jQuery} $group - group of elements for which form controls should be updated (with current model values)
   * @param {number} groupIndex - index of the group
   */
  setAllVals($group: jQuery, groupIndex: number): void;
  /**
   * @param {jQuery} $control - HTML form control
   * @return {string|undefined} Value
   */
  getModelValue($control: jQuery): string | undefined;
  /**
   * Finds nodes that have attributes with XPath expressions that refer to particular XML elements.
   *
   * @param {string} attr - The attribute name to search for
   * @param {string} [filter] - The optional filter to append to each selector
   * @param {UpdatedDataNodes} updated - object that contains information on updated nodes
   * @return {jQuery} - A jQuery collection of elements
   */
  getRelatedNodes(
    attr: string,
    filter?: string | undefined,
    updated?: UpdatedDataNodes
  ): jQuery;
  /**
   * @param {Array<Element>} controls - radiobutton/checkbox HTML input elements
   * @return {Array<Element>} filtered controls without any sibling radiobuttons and checkboxes (only the first)
   */
  filterRadioCheckSiblings(controls: Array<Element>): Array<Element>;
  /**
   * Crafts an optimized selector for element attributes that contain an expression with a target node name.
   *
   * @param {string} filter - The filter to use
   * @param {string} attr - The attribute to target
   * @param {string} nodeName - The XML nodeName to find
   * @return {string} The selector
   */
  getQuerySelectorsForLogic(
    filter: string,
    attr: string,
    nodeName: string
  ): string;
  /**
   * Obtains the XML primary instance as string without nodes that have a relevant
   * that evaluates to false.
   *
   * Though this function may be slow it is slow when it doesn't matter much (upon saving). The
   * alternative is to add some logic to relevant.update to mark irrelevant nodes in the model
   * but that would slow down form loading and form traversal when it does matter.
   *
   * @return {string} Data string
   */
  getDataStrWithoutIrrelevantNodes(): string;
  /**
   * See https://groups.google.com/forum/?fromgroups=#!topic/opendatakit-developers/oBn7eQNQGTg
   * and http://code.google.com/p/opendatakit/issues/detail?id=706
   *
   * This is using an aggressive name attribute selector to also find e.g. name="/../orx:meta/orx:instanceID", with
   * *ANY* namespace prefix.
   *
   * Once the following is complete this function can and should be removed:
   *
   * 1. ODK Collect starts supporting an instanceID preload item (or automatic handling of meta->instanceID without binding)
   * 2. Pyxforms changes the instanceID binding from calculate to preload (or without binding)
   * 3. Formhub has re-generated all stored XML forms from the stored XLS forms with the updated pyxforms
   *
   */
  grosslyViolateStandardComplianceByIgnoringCertainCalcs(): void;
  /**
   * This re-validates questions that have a dependency on a question that has just been updated.
   *
   * Note: it does not take care of re-validating a question itself after its value has changed due to a calculation update!
   *
   * @param {UpdatedDataNodes} updated - object that contains information on updated nodes
   */
  validationUpdate(updated?: UpdatedDataNodes): void;
  /**
   * A big function that sets event handlers.
   */
  setEventHandlers(): void;
  /**
   * Removes an invalid mark on a question in the form UI.
   *
   * @param {Element} control - form control HTML element
   * @param {string} [type] - One of "constraint", "required" and "relevant".
   */
  setValid(control: Element, type?: string | undefined): void;
  /**
   * Marks a question as invalid in the form UI.
   *
   * @param {Element} control - form control HTML element
   * @param {string} [type] - One of "constraint", "required" and "relevant".
   */
  setInvalid(control: Element, type?: string | undefined): void;
  /**
   *
   * @param {*} control - form control HTML element
   * @param {*} result - result object obtained from Nodeset.validate
   */
  updateValidityInUi(control: any, result: any): void;
  /**
   * Blocks page navigation for a short period.
   * This can be used to ensure that the user sees a new error message before moving to another page.
   */
  blockPageNavigation(): void;
  blockPageNavigationTimeout: number | undefined;
  /**
   * Checks whether the question is not currently marked as invalid. If no argument is provided, it checks the whole form.
   *
   * @param {Element} node - form control HTML element
   * @return {!boolean} Whether the question/form is not marked as invalid.
   */
  isValid(node: Element): boolean;
  /**
   * Clears non-relevant values.
   */
  clearNonRelevant(): void;
  /**
   * Clears all non-relevant question values if necessary and then
   * validates all enabled input fields after first resetting everything as valid.
   *
   * @return {Promise} wrapping {boolean} whether the form contains any errors
   */
  validateAll(): Promise<any>;
  /**
   * Alias of validateAll
   *
   * @function
   */
  validate: any;
  /**
   * Validates all enabled input fields in the supplied container, after first resetting everything as valid.
   *
   * @param {jQuery} $container - HTML container element inside which to validate form controls
   * @return {Promise} wrapping {boolean} whether the container contains any errors
   */
  validateContent($container: jQuery): Promise<any>;
  /**
   * @param {string} targetPath - simple relative or absolute path
   * @param {string} contextPath - absolute context path
   * @return {string} absolute path
   */
  pathToAbsolute(targetPath: string, contextPath: string): string;
  /**
   * @typedef ValidateInputResolution
   * @property {boolean} requiredValid
   * @property {boolean} constraintValid
   */
  /**
   * Validates question values.
   *
   * @param {Element} control - form control HTML element
   * @return {Promise<undefined|ValidateInputResolution>} resolves with validation result
   */
  validateInput(control: Element): Promise<undefined | ValidateInputResolution>;
  /**
   * @param {string} path - path to HTML form control
   * @return {null|Element} HTML question element
   */
  getGoToTarget(path: string): null | Element;
  /**
   * Scrolls to an HTML question or group element, flips to the page it is on and focuses on the nearest form control.
   *
   * @param {HTMLElement} target - An HTML question or group element to scroll to
   * @return {boolean} whether target found
   */
  goToTarget(target: HTMLElement): boolean;
  nodePathToRepeatPath: Record<string, string | null>;
  evaluationCascadeAdditions: any[];
  /**
   * @type {Array}
   */
  get evaluationCascade(): any[];
  set recordName(arg: string);
  /**
   * @type {string}
   */
  get recordName(): string;
  /**
   * @type {string}
   */
  get surveyName(): string;
  /**
   * @type {string}
   */
  get instanceID(): string;
  /**
   * @type {string}
   */
  get deprecatedID(): string;
  /**
   * @type {string}
   */
  get instanceName(): string;
  /**
   * @type {string}
   */
  get version(): string;
  /**
   * @type {string}
   */
  get encryptionKey(): string;
  /**
   * @type {string}
   */
  get action(): string;
  /**
   * @type {string}
   */
  get method(): string;
  /**
   * @type {string}
   */
  get id(): string;
  /**
   * To facilitate forks that support multiple constraints per question
   *
   * @type {Array<string>}
   */
  get constraintClassesInvalid(): string[];
  /**
   * To facilitate forks that support multiple constraints per question
   *
   * @type {Array<string>}
   */
  get constraintAttributes(): string[];
  /**
   * @type {Array<string>}
   */
  get languages(): string[];
  /**
   * @type {string}
   */
  get currentLanguage(): string;
}
export namespace Form {
  export { requiredTransformerVersion };
}
import { FormModel } from './form-model';
declare var requiredTransformerVersion: string;
export { FormModel };
