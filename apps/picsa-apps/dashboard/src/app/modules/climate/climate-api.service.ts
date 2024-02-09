import { Injectable } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import createClient from 'openapi-fetch';

import { paths } from './types/api';

const API_ENDPOINT = 'https://api.epicsa.idems.international';

/** Custom client which tracks responses by callback id */
type ICallbackClient = (id:string)=>ReturnType<typeof createClient<paths>>

/** Type-safe http client with added support for callbacks */
type IClient = ReturnType<typeof createClient<paths>> & {useMeta:ICallbackClient}



interface IMetaEntry{
  status:'pending' | 'success' | 'error' | 'unknown',
  rawResponse?:Response,
}


/** 
 * Service to interact with external PICSA Climate API 
 * All methods are exposed through a type-safe `client` property, or can additionally use
 * a custom client that includes status notification updates via the `useMeta` method
 * @example
 * Use custom callback that will show user notifications on error and record to service
 * ```ts
 * const {response, data, error} = await api.useMeta('myRequestId').POST(...)
 * ```
 * Use default client without additional callbacks
 * ```ts
 * const {response, data, error} = await api.client.POST(...)
 * ```
 * */
@Injectable({ providedIn: 'root' })
export class ClimateApiService {

  /** Request additional meta by id */
  public meta:Record<string ,IMetaEntry>={}
  
  /** Http client with type-definitions for API endpoints */
  public client:IClient

  constructor(private notificationService:PicsaNotificationService) {
    const client = createClient<paths>({ baseUrl: API_ENDPOINT,mode:'cors' });
    this.client = {...client,useMeta:()=>{
      return client
    }}
  }


  /** 
   * Provide an id which which will be updated alongside requests. 
   * The cache will also include interceptors to provide user notification on error 
   **/
  public useMeta(id:string){
    const customFetch = this.createCustomFetchClient(id)
    const customClient = createClient<paths>({ baseUrl: API_ENDPOINT,mode:'cors',fetch:customFetch });
    return customClient
  }

  /** Create a custom implementation of fetch client to handle status updates and notifications */
  private createCustomFetchClient(id:string){
   return async (...args:Parameters<typeof window['fetch']>)=>{
      this.meta[id]={status:'pending'}
      const response = await window.fetch(...args);
      this.meta[id].status =  this.getCallbackStatus(response.status)
      this.meta[id].rawResponse = response
      if(this.meta[id].status ==='error' ){
        await this.showCustomFetchErrorMessage(id,response)
      }
      return response
    }
  }

  /** Show error message when using custom fetch with callbacks */
  private async showCustomFetchErrorMessage(id:string,response:Response){
    // clone body so that open-api can still consume when constructing full fetch response
    const clone = response.clone()
    try {
      const json  = await clone.json()
      const errorText = json.detail || 'failed, see console logs for details'
      this.notificationService.showUserNotification({matIcon:'error',message:`[${id}] ${errorText}`})
    } catch (error) {
      console.error(error)
      console.error('Fetch Error',error)
      this.notificationService.showUserNotification({matIcon:'error',message:`[${id}] 'failed, see console logs for details'`})
    }
  }

  private getCallbackStatus(statusCode:number):IMetaEntry['status']{
    if(200 <= statusCode && statusCode <=299) return 'success'
    if(400 <= statusCode && statusCode <=499) return 'error'
    if(500 <= statusCode && statusCode <=599) return 'error'
    return 'unknown'
  }
}
