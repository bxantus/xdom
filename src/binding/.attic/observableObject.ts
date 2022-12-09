import { SubscriptionRepository, type PropChanges, AnyPropChange } from "../subscriptions.ts"
export { any } from '../subscriptions.ts'

export function makeObservable<T>(initialProps:T):ObservableObject<T> {
    const oo = new ObservableObjectBase()
    for (const key in initialProps) {
        (oo as any)[key] = initialProps[key]
    }
    return new Proxy(oo, observableTraps) as (ObservableObjectBase & T & AnyPropChange)
}

export type ObservableObject<T> = {
    $changes:PropChanges<keyof T & string> & AnyPropChange
} & T 

export type MaybeObservable<T> = {
    $changes?:PropChanges<keyof T & string> & AnyPropChange
} & T 

class ObservableObjectBase {
    __subs = new SubscriptionRepository

    get $changes() { return this.__subs.changes }

    constructor() {

    }    
 }

class ObservableTraps {
    get(target:any, p:string|symbol, receiver:any) {
        return target[p]
    }

    set(target:any, p:string|symbol, value:any, receiver:any) {
        const old = target[p]
        if (old != value) {
            target[p] = value
            target.__subs.notifyFor(p as string, value)
        }
        return true
    }
}

const observableTraps = new ObservableTraps