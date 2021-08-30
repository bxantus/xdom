export interface Subscription {
    unsubscribe():void
    dispose():void
}

export interface Subscriber<T> {
    onChange(newVal:T):void
}

/**
 * Use SubscriptionRepository inside your model classes (classes representing data, which can change, and users are intreseted in changes. See the Observer pattern).
 * Note, that a one to one relationship between object properties and properties registered in subscriptionrepository isn't needed.
 * You can have computed properties (not requiring storage), but changes may be fired for them as well using SubscriptionRepositor.
 * 
 * The data structure used tries to use limited memory space if no subscriptions are used, or if there are only subscriptions to a few properties.  
 */
export class SubscriptionRepository {
    // todo: add a generic getter function for the given properties, using T type
    //       this will ensure users with correct types, and they don't have to type strings
    // ex.: getSubscription<MyuSuperType>("alma")
    //      user codes could write: {  get onAlma() { return  this.subs.getSubscription<AlmaType>() } }

    add(name:string, changeFunc:(newVal:any) => void):Subscription {
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

    notifyFor(name:string, newVal:any) {
        let subsForName = this.subs.get(name)
        if (subsForName)
            for (let s of subsForName) s.onChange(newVal)
    }

    private subs = new Map<string, Subscriber<any>[]>()
}

