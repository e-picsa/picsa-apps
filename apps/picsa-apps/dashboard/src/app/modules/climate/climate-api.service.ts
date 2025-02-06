import { Injectable } from '@angular/core';
import createClient from 'openapi-fetch';
import {  BehaviorSubject, Subject } from 'rxjs';

import { paths } from './types/api';

const API_ENDPOINT = 'https://api.epicsa.idems.international';
// const API_ENDPOINT = 'http://localhost:8000';

/** Type-safe http client with added support for callbacks */
export type IApiClient = ReturnType<typeof createClient<paths>> & { $:Subject<Response | undefined>}

/** 
 * Service to interact with external PICSA Climate API 
 * All methods are exposed through a type-safe `client` property, or can additionally use
 * a custom client that includes status notification updates via the `useMeta` method
 * @example
 * Use observable client that can also be accessed by api-status component
 * ```ts
 * await api.getObservableClient('myRequestId').POST(...)
 * ```
 * ```html
 * <dashboard-climate-api-status clientId='myRequestId' />
 * ```
 * 
 * Use default client without additional callbacks
 * ```ts
 * const {response, data, error} = await api.client.POST(...)
 * ```
 * */
@Injectable({ providedIn: 'root' })
export class ClimateApiService {
  
  /** Http client with type-definitions for API endpoints */
  public client:IApiClient

  /** List of custom clients generated to be shared across observers */
  private observableClients:Record<string,IApiClient> = {}

  constructor() {
    this.client = this.createObservableClient('_default')
  }

  /**
   * Retrive an instance of the api client with a specific ID so that request updates can be subscribed to
   * by any other services or components accessing via the same id. Creates new client if not existing
   */
  public getObservableClient(clientId?:string):IApiClient{
    if(clientId){
      return this.observableClients[clientId] || this.createObservableClient(clientId)
    }
    return this.client
  }

  private createObservableClient(clientId:string){
    const $ = new BehaviorSubject<Response | undefined>(undefined)
    const customFetch = async (...args:Parameters<typeof window['fetch']>)=>{
      // send a custom response with 102 status code to inform that request has been sent but is pending
      $.next({status:102} as Response)
      try {
        const response = await window.fetch(...args);
        $.next(response)      
        return response
      } catch (error:any) {
        // Likely internal server error thrown
        console.error(args)
        console.error(error)
        const message = error.message
        const blob = new Blob([JSON.stringify({message}, null, 2)], {type : 'application/json'});
        const errorRes = new Response(blob,{status:500,statusText:message})
        $.next(errorRes)
        return errorRes
      }
     
    }
    const baseClient = createClient<paths>({ baseUrl: API_ENDPOINT,mode:'cors',fetch:customFetch });
    const client:IApiClient ={...baseClient, $}
    this.observableClients[clientId] = client
    return client
  }




 
}
