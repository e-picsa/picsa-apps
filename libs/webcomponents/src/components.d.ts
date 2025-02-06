/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { IEventDataUpdated, IEventFormSaved } from "./components/enketo-webform/enketo-webform";
export { IEventDataUpdated, IEventFormSaved } from "./components/enketo-webform/enketo-webform";
export namespace Components {
    interface EnketoWebform {
        /**
          * HTML form template
         */
        "form": string;
        /**
          * XML form model, as processed by an Enketo Transformer
         */
        "model": string;
        "showButtons": boolean;
    }
}
export interface EnketoWebformCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLEnketoWebformElement;
}
declare global {
    interface HTMLEnketoWebformElementEventMap {
        "dataUpdated": IEventDataUpdated;
        "formSaved": IEventFormSaved;
    }
    interface HTMLEnketoWebformElement extends Components.EnketoWebform, HTMLStencilElement {
        addEventListener<K extends keyof HTMLEnketoWebformElementEventMap>(type: K, listener: (this: HTMLEnketoWebformElement, ev: EnketoWebformCustomEvent<HTMLEnketoWebformElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
        removeEventListener<K extends keyof HTMLEnketoWebformElementEventMap>(type: K, listener: (this: HTMLEnketoWebformElement, ev: EnketoWebformCustomEvent<HTMLEnketoWebformElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    }
    var HTMLEnketoWebformElement: {
        prototype: HTMLEnketoWebformElement;
        new (): HTMLEnketoWebformElement;
    };
    interface HTMLElementTagNameMap {
        "enketo-webform": HTMLEnketoWebformElement;
    }
}
declare namespace LocalJSX {
    interface EnketoWebform {
        /**
          * HTML form template
         */
        "form": string;
        /**
          * XML form model, as processed by an Enketo Transformer
         */
        "model": string;
        "onDataUpdated"?: (event: EnketoWebformCustomEvent<IEventDataUpdated>) => void;
        "onFormSaved"?: (event: EnketoWebformCustomEvent<IEventFormSaved>) => void;
        "showButtons"?: boolean;
    }
    interface IntrinsicElements {
        "enketo-webform": EnketoWebform;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "enketo-webform": LocalJSX.EnketoWebform & JSXBase.HTMLAttributes<HTMLEnketoWebformElement>;
        }
    }
}
