import { Subscription, SubscriptionRepository } from "./subscriptions.ts"

// model reperesenting range and value 
export class RangeModel { 
    private _min:number = 0
    private _max:number = 100
    private _val:number = 0
    
    get val():number { return this._val }
    get min():number { return this._min }
    get max():number { return this._max }

    set val(newVal:number) {
        if (newVal < this._min) newVal = this._min
        else if (newVal > this._max) newVal = this._max
        this.updateValue(newVal)
    }

    /// replace range, if min or max is not given the old values are used
    setRange(min:number|undefined, max:number|undefined) {
        if (min == undefined) min = this._min
        if (max == undefined) max = this._max
        if (min >= max) 
            throw new Error(`Invalid range! (min < max) should hold. Got: ${min} >= ${max}`)
        this._min = min
        this._max = max
        if (this._val < min)
            this.updateValue(min)
        else if (this._val > max)
            this.updateValue(max)
    }

    // subscribe for changes in value
    subscribe(prop:"value", changeFunc:(v:number) => void):Subscription {
        return this.subs.add(prop, changeFunc)
    }

    private updateValue(newVal:number) {
        if (this._val != newVal) {
            this._val = newVal
            this.subs.notifyFor("value", newVal)
        }
    }

    private subs = new SubscriptionRepository()
}
