import { SubscriptionRepository, type PropChanges, AnyPropChange } from "./subscriptions.ts"
export { any } from './subscriptions.ts'

export function makeObservable<T>(initialProps:T):Observable<T> {
    const oo = new ObservableObject()
    for (const key in initialProps) {
        (oo as any)[key] = initialProps[key]
    }
    return new Proxy(oo, observableTraps) as (ObservableObject & T & AnyPropChange)
}

export type Observable<T> = {
    $changes:PropChanges<keyof T & string> & AnyPropChange
} & T 

export type MaybeObservable<T> = {
    $changes?:PropChanges<keyof T & string> & AnyPropChange
} & T 

class ObservableObject {
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