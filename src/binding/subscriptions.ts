export interface Subscription {
    unsubscribe():void
    dispose():void
}

interface Subscriber {
    onChange():any
}

// use the `triggered` wrapper/modifier for a subscriber to trigger the subscriber right befor subscribing
export function triggered(subscriber:()=>any) {
    subscriber()
    return subscriber
}

export interface Observable {
    subscribe(subscriber:()=>any):Subscription
}

export const any = Symbol("AnyProperty")

export type PropChanges<Props extends string> = {
    [key in Props]:Observable
}

export interface AnyPropChange {
    [any]:Observable
}

/**
 * Use SubscriptionRepository inside your model classes (classes representing data, which can change, and users are intreseted in changes. See the Observer pattern).
 * Note, that a one to one relationship between object properties and properties registered in subscriptionrepository isn't needed.
 * You can have computed properties (not requiring storage), but changes may be fired for them as well using SubscriptionRepository.
 * 
 * The data structure used tries to use limited memory space if no subscriptions are used, or if there are only subscriptions to a few properties.  
 */
export class SubscriptionRepository<Props extends string> {
    
    /**
     * NOTE: Use the special `any` symbol to install change functions for any property change.
     */
    add(name:string|symbol, changeFunc:() => any):Subscription {
        let subsForName = this.subs.get(name) || []
        if (subsForName.length == 0) {
            this.subs.set(name, subsForName)
        }

        let sub = { onChange: changeFunc }
        subsForName.push(sub)
        const unsubscribe = () => {
            const idx = subsForName.findIndex(val => val == sub)
            if (idx >= 0) subsForName.splice(idx)
        }
        return {
            unsubscribe, dispose: unsubscribe
        }
    }

    notifyFor(...names:Props[]) {
        for (const name of names) {
            const subsForName = this.subs.get(name)
            if (subsForName)
                for (let s of subsForName) s.onChange()
        }
        const anyPropSubs = this.subs.get(any)
        if (anyPropSubs)
            for (let s of anyPropSubs) s.onChange()
    }

    get changes():PropChanges<Props> & AnyPropChange {
        return this.changesProxy
    }

    private subs = new Map<string|symbol, Subscriber[]>()
    private changesProxy = new Proxy(this as any, {
        get(target:SubscriptionRepository<Props>, p:string|symbol):Observable {
            return {
                subscribe(subscriber:()=>any) {
                    return target.add(p, subscriber)
                }
            }
        }
    }) 
}

