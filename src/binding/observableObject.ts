import { SubscriptionRepository, Subscription, AnyProperty } from "./subscriptions.ts"

// todo: - add generic type parameter to observable object
//       - extract create function from inside
//       - add changes interface to created objects
// This can be a great tool for creating simple observable dictionary objects, conforming to a given interface

export class ObservableObject {
    __subs = new SubscriptionRepository

    get changes() { return this.__subs.changes }

    private constructor() {

    }

    static create<T>(initialProps:T):ObservableObject & T {
        const oo = new ObservableObject()
        for (const key in initialProps) {
            (oo as any)[key] = initialProps[key]
        }
        return new Proxy(oo, observableTraps) as (ObservableObject & T)
    }
 }

class ObservableTraps {
    get(target:ObservableObject, p:string|symbol, receiver) {
        return target[p]
    }

    set(target:ObservableObject, p:string|symbol, value:any, receiver) {
        const old = target[p]
        if (old != value) {
            target[p] = value
            target.__subs.notifyFor(p as string, value)
        }
        return true
    }
}

const observableTraps = new ObservableTraps