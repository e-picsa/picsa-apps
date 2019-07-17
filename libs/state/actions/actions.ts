import { FluxStandardAction } from "flux-standard-action";
// could use better-defined actions to describe type of payload within reducers
// but here is general action for any payload and meta
export type StandardAction = FluxStandardAction<any, any>;
