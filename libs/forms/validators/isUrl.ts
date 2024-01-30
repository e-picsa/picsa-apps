import { Validators } from '@angular/forms';

/**
 * Custom form validator to match url regex pattern
 * https://www.positronx.io/angular-url-validation-with-reactive-forms-tutorial/
 */
export default Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?');
