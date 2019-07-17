import { dispatch } from "@angular-redux/store";
import { Injectable } from "@angular/core";
import { FluxStandardAction } from "flux-standard-action";

export type PlatformAction = FluxStandardAction<string, string>;

@Injectable({ providedIn: "root" })
export class PlatformActions {
  static readonly ERROR_THROWN = "[ERROR] thrown";

  @dispatch()
  throwError = (data: Error): PlatformAction => ({
    type: PlatformActions.ERROR_THROWN,
    payload: data.message
  });
}
