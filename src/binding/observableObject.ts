import { SubscriptionRepository, Subscription, AnyProperty } from "./subscriptions.ts"

export class ObservableObject {
    __subs = new SubscriptionRepository
    private constructor() {

    }

    static create<T>(initialProps:T):ObservableObject & T {
        const oo = new ObservableObject()
        for (const key in initialProps) {
            (oo as any)[key] = initialProps[key]
        }
        return new Proxy(oo, observableTraps) as (ObservableObject & T)
    }

    subscribe(prop:string, changeFunc:(newVal:any) => void):Subscription {
        return this.__subs.add(prop, changeFunc)
    }

    subscribeToAllChanges(changeFunc:()=>void):Subscription {
        return this.__subs.add(AnyProperty, changeFunc)        
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