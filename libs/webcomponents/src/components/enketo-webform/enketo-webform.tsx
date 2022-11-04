import { Component, Fragment, h, Prop } from '@stencil/core';
import { Form } from './enketo/js/form';

@Component({
  tag: 'enketo-webform',
  styleUrl: 'enketo-webform.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
/**
 *
 * NOTE -  this uses a very hacky port of enketo-core as failed to find ways to import
 * from the IIFE default build populated in node_modules.
 * This mostly involved renaming some .js -> .ts and fixing imports (to allow form.js import)
 * In future suggest creating standalone repo, using ts refs for enketo/... imports
 * Assume still required to install as it still uses imports from enketo-core deps
 *
 * https://enketo.org/develop/
 */
export class EnketoWebform {
  private formEl: HTMLDivElement;
  private enketoForm: Form;

  /** HTML form template */
  @Prop() form!: string;

  /** XML form model, as processed by an Enketo Transformer */
  @Prop() model!: string;

  render() {
    if (!this.form || !this.model) {
      return <p data-testid="form-na">Form not available</p>;
    }

    return (
      <Fragment>
        <this.EnketoLogo />
        <div ref={(el) => (this.formEl = el as HTMLDivElement)} />
      </Fragment>
    );
  }

  componentDidLoad() {
    this.loadForm();
  }
  componentDidUpdate() {
    this.loadForm();
  }

  /**
   * Load the form xml and data models and render intial form components
   * https://enketo.github.io/enketo-core/tutorial-00-getting-started.html
   */
  private loadForm() {
    const { form, model, formEl } = this;
    if (form && model && formEl) {
      this.formEl.innerHTML = this.form;
      this.enketoForm = new Form(this.formEl, this.model, {});
      // Initialize the form and capture any load errors
      let loadErrors = this.enketoForm.init();
      if (loadErrors.length > 0) {
        console.error(loadErrors);
      }
      // If desired, scroll to a specific question with any XPath location expression,
      // and aggregate any loadErrors.
      loadErrors = loadErrors.concat(this.enketoForm.goTo('//repeat[3]/node'));
    }
  }

  EnketoLogo = () => (
    <div class="enketo-logo-container">
      <span>Powered by</span>
      <a href="http://enketo.org" title="enketo.org website">
        <img
          class="enketo-logo"
          src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCwgMCwgMjIwLCAxMDAiPgogIDxnIGlkPSJMYXllciAxIj4KICAgIDxnPgogICAgICA8cGF0aCBkPSJNMTcuOTUyLDcyLjQ4MiBMMTcuOTUyLDM4LjU0MSBDMTcuOTUyLDM1Ljg2OCAyMC4wNjYsMzMuNzU0IDIyLjczOCwzMy43NTQgTDM2LjQ5NiwzMy43NTQgQzM4Ljg1OSwzMy43NTQgNDAuNzg2LDM1LjY4MSA0MC43ODYsMzguMDQ0IEM0MC43ODYsNDAuNDA3IDM4Ljg1OSw0Mi4yNzEgMzYuNDk2LDQyLjI3MSBMMjcuNDY0LDQyLjI3MSBMMjcuNDY0LDUxLjA5OCBMMzMuNjk5LDUxLjA5OCBDMzYuMDYxLDUxLjA5OCAzNy45ODksNTMuMDI1IDM3Ljk4OSw1NS4zODggQzM3Ljk4OSw1Ny43NSAzNi4wNjEsNTkuNjE1IDMzLjY5OSw1OS42MTUgTDI3LjQ2NCw1OS42MTUgTDI3LjQ2NCw2OC43NTQgTDM2LjgwOCw2OC43NTQgQzM5LjE3LDY4Ljc1NCA0MS4wOTgsNzAuNjggNDEuMDk4LDczLjA0MyBDNDEuMDk4LDc1LjQwNCAzOS4xNyw3Ny4yNyAzNi44MDgsNzcuMjcgTDIyLjczOSw3Ny4yNyBDMjAuMDY2LDc3LjI2OSAxNy45NTIsNzUuMTU2IDE3Ljk1Miw3Mi40ODIgeiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJNMTE3LjkxOCw3Mi40ODIgTDExNy45MTgsMzguNTQxIEMxMTcuOTE4LDM1Ljg2OCAxMjAuMDMyLDMzLjc1NCAxMjIuNzA1LDMzLjc1NCBMMTM2LjQ2MywzMy43NTQgQzEzOC44MjUsMzMuNzU0IDE0MC43NTIsMzUuNjgxIDE0MC43NTIsMzguMDQ0IEMxNDAuNzUyLDQwLjQwNyAxMzguODI1LDQyLjI3MSAxMzYuNDYzLDQyLjI3MSBMMTI3LjQzLDQyLjI3MSBMMTI3LjQzLDUxLjA5OCBMMTMzLjY2Nyw1MS4wOTggQzEzNi4wMjgsNTEuMDk4IDEzNy45NTUsNTMuMDI1IDEzNy45NTUsNTUuMzg4IEMxMzcuOTU1LDU3Ljc1IDEzNi4wMjgsNTkuNjE1IDEzMy42NjcsNTkuNjE1IEwxMjcuNDMsNTkuNjE1IEwxMjcuNDMsNjguNzU0IEwxMzYuNzc1LDY4Ljc1NCBDMTM5LjEzNiw2OC43NTQgMTQxLjA2NCw3MC42OCAxNDEuMDY0LDczLjA0MyBDMTQxLjA2NCw3NS40MDQgMTM5LjEzNiw3Ny4yNyAxMzYuNzc1LDc3LjI3IEwxMjIuNzA2LDc3LjI3IEMxMjAuMDMyLDc3LjI2OSAxMTcuOTE4LDc1LjE1NiAxMTcuOTE4LDcyLjQ4MiB6IiBmaWxsPSIjMDAwMDAwIi8+CiAgICAgIDxwYXRoIGQ9Ik0xNTMuOTAyLDQyLjU4MiBMMTQ5Ljg4MSw0Mi41ODIgQzE0Ny40NTcsNDIuNTgyIDE0NS40NjcsNDAuNTkzIDE0NS40NjcsMzguMTY4IEMxNDUuNDY3LDM1Ljc0NCAxNDcuNDU3LDMzLjc1NCAxNDkuODgxLDMzLjc1NCBMMTY3LjQ5MywzMy43NTQgQzE2OS45MTcsMzMuNzU0IDE3MS45MDcsMzUuNzQzIDE3MS45MDcsMzguMTY4IEMxNzEuOTA3LDQwLjU5MyAxNjkuOTE3LDQyLjU4MiAxNjcuNDkzLDQyLjU4MiBMMTYzLjQ3Myw0Mi41ODIgTDE2My40NzMsNzIuODU1IEMxNjMuNDczLDc1LjUyOSAxNjEuMzYsNzcuNjQyIDE1OC42ODgsNzcuNjQyIEMxNTYuMDEzLDc3LjY0MiAxNTMuOTAxLDc1LjUyOSAxNTMuOTAxLDcyLjg1NSBMMTUzLjkwMSw0Mi41ODIgeiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJNNzQuMzgzLDc3Ljk3NyBDNzIuODg2LDc3Ljk3NyA3MS40MjIsNzcuMjI2IDcwLjU3Miw3NS44NjEgTDQ4LjY3Miw0MC42MzQgQzQ3LjM2NCwzOC41MzIgNDguMDEsMzUuNzY4IDUwLjExMiwzNC40NjIgQzUyLjIxMSwzMy4xNTUgNTQuOTc2LDMzLjc5OSA1Ni4yODMsMzUuOTAxIEw3OC4xODMsNzEuMTI4IEM3OS40OSw3My4yMzEgNzguODQ2LDc1Ljk5MyA3Ni43NDQsNzcuMyBDNzYuMDA4LDc3Ljc1OSA3NS4xOSw3Ny45NzcgNzQuMzgzLDc3Ljk3NyB6IiBmaWxsPSIjMDAwMDAwIi8+CiAgICAgIDxwYXRoIGQ9Ik03NS4wMDEsNzcuOTc2IEM3Mi41MjcsNzcuOTc2IDcwLjUyLDc1Ljk3IDcwLjUyLDczLjQ5NiBMNzAuNTIsMzguMjY4IEM3MC41MiwzNS43OTMgNzIuNTI4LDMzLjc4NyA3NS4wMDEsMzMuNzg3IEM3Ny40NzcsMzMuNzg3IDc5LjQ4MiwzNS43OTMgNzkuNDgyLDM4LjI2OCBMNzkuNDgyLDczLjQ5NiBDNzkuNDgyLDc1Ljk3IDc3LjQ3Niw3Ny45NzYgNzUuMDAxLDc3Ljk3NiB6IiBmaWxsPSIjMDAwMDAwIi8+CiAgICAgIDxwYXRoIGQ9Ik01MS4wNTMsNzcuOTc2IEM0OC41NzcsNzcuOTc2IDQ2LjU3Miw3NS45NyA0Ni41NzIsNzMuNDk2IEw0Ni41NzIsMzguMjY4IEM0Ni41NzIsMzUuNzkzIDQ4LjU3OCwzMy43ODcgNTEuMDUzLDMzLjc4NyBDNTMuNTI4LDMzLjc4NyA1NS41MzQsMzUuNzkzIDU1LjUzNCwzOC4yNjggTDU1LjUzNCw3My40OTYgQzU1LjUzNSw3NS45NyA1My41MjksNzcuOTc2IDUxLjA1Myw3Ny45NzYgeiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJNODkuNjQ4LDc3Ljk3NiBDODcuMTczLDc3Ljk3NiA4NS4xNjcsNzUuOTcgODUuMTY3LDczLjQ5NiBMODUuMTY3LDM4LjI2OCBDODUuMTY3LDM1Ljc5MyA4Ny4xNzQsMzMuNzg3IDg5LjY0OCwzMy43ODcgQzkyLjEyMiwzMy43ODcgOTQuMTI5LDM1Ljc5MyA5NC4xMjksMzguMjY4IEw5NC4xMjksNzMuNDk2IEM5NC4xMyw3NS45NyA5Mi4xMjMsNzcuOTc2IDg5LjY0OCw3Ny45NzYgeiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJNOTAuNjc5LDY4LjAwNCBDODkuODE2LDY4LjAwNCA4OC45NDEsNjcuNzU1IDg4LjE3Miw2Ny4yMzQgQzg2LjEyMyw2NS44NDUgODUuNTg1LDYzLjA2IDg2Ljk3Myw2MS4wMSBMMTA0LjA2OCwzNS43NTUgQzEwNS40NTcsMzMuNzA1IDEwOC4yNDEsMzMuMTY5IDExMC4yOTMsMzQuNTU2IEMxMTIuMzQyLDM1Ljk0MyAxMTIuODc5LDM4LjcyOSAxMTEuNDkyLDQwLjc3OSBMOTQuMzk2LDY2LjAzNCBDOTMuNTI5LDY3LjMxNCA5Mi4xMTcsNjguMDA0IDkwLjY3OSw2OC4wMDQgeiIgZmlsbD0iIzAwMDAwMCIvPgogICAgICA8cGF0aCBkPSJNMTA5LjA4LDc3Ljk3NyBDMTA3LjYyNyw3Ny45NzcgMTA2LjIwMyw3Ny4yNzEgMTA1LjMzOSw3NS45NyBMOTIuNDMzLDU2LjQ5NSBDOTEuMDY3LDU0LjQzMiA5MS42MzEsNTEuNjUxIDkzLjY5Myw1MC4yODQgQzk1Ljc1NSw0OC45MTYgOTguNTM2LDQ5LjQ4MSA5OS45MDUsNTEuNTQ0IEwxMTIuODExLDcxLjAxOSBDMTE0LjE3OCw3My4wODIgMTEzLjYxNCw3NS44NjMgMTExLjU1MSw3Ny4yMyBDMTEwLjc4OSw3Ny43MzUgMTA5LjkyOSw3Ny45NzcgMTA5LjA4LDc3Ljk3NyB6IiBmaWxsPSIjMDAwMDAwIi8+CiAgICAgIDxwYXRoIGQ9Ik0xODguMTkxLDc4LjAyOCBDMTgwLjU0OSw3OC4wMjggMTc0LjMzMyw3MS44MTEgMTc0LjMzMyw2NC4xNyBMMTc0LjMzMyw0Ny41OTMgQzE3NC4zMzMsMzkuOTUyIDE4MC41NSwzMy43MzYgMTg4LjE5MSwzMy43MzYgQzE5NS44MzIsMzMuNzM2IDIwMi4wNDgsMzkuOTUyIDIwMi4wNDgsNDcuNTkzIEwyMDIuMDQ4LDY0LjE3IEMyMDIuMDQ4LDcxLjgxMSAxOTUuODMyLDc4LjAyOCAxODguMTkxLDc4LjAyOCB6IE0xODguMTkxLDQyLjgwMSBDMTg1LjU0OCw0Mi44MDEgMTgzLjM5OCw0NC45NSAxODMuMzk4LDQ3LjU5MyBMMTgzLjM5OCw2NC4xNyBDMTgzLjM5OCw2Ni44MTMgMTg1LjU0OCw2OC45NjMgMTg4LjE5MSw2OC45NjMgQzE5MC44MzMsNjguOTYzIDE5Mi45ODMsNjYuODEzIDE5Mi45ODMsNjQuMTcgTDE5Mi45ODMsNDcuNTkzIEMxOTIuOTgzLDQ0Ljk1IDE5MC44MzMsNDIuODAxIDE4OC4xOTEsNDIuODAxIHoiIGZpbGw9IiMwMDAwMDAiLz4KICAgICAgPHBhdGggZD0iTTEyNy40ODMsMjkuMzQzIEMxMjcuNDUsMjkuMzQzIDEyNy40MTYsMjkuMzQzIDEyNy4zODIsMjkuMzQyIEMxMjYuMjczLDI5LjMxNSAxMjUuMjE5LDI4Ljg0NCAxMjQuNDU5LDI4LjAzMyBMMTE4LjYzNCwyMS44MTggQzExNy4wNjksMjAuMTQ5IDExNy4xNTIsMTcuNTI2IDExOC44MjMsMTUuOTYgQzEyMC40OTIsMTQuMzk1IDEyMy4xMTYsMTQuNDggMTI0LjY4LDE2LjE1IEwxMjcuNjI0LDE5LjI5IEwxMzcuMDY2LDEwLjE0MiBDMTM4LjcwOSw4LjU1MSAxNDEuMzMyLDguNTkxIDE0Mi45MjYsMTAuMjM1IEMxNDQuNTE5LDExLjg3OSAxNDQuNDc3LDE0LjUwMyAxNDIuODMzLDE2LjA5NSBMMTMwLjM2NCwyOC4xNzQgQzEyOS41OTEsMjguOTI2IDEyOC41NTgsMjkuMzQzIDEyNy40ODMsMjkuMzQzIHoiIGZpbGw9IiNGMTVBMjkiLz4KICAgIDwvZz4KICA8L2c+CiAgPGRlZnMvPgo8L3N2Zz4K"
          alt="Enketo logo"
        />
      </a>
    </div>
  );
}
