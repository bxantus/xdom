import { Observable, Subscription } from "./subscriptions.ts"
import { dispose } from "../base.ts"

type valueFunction<T> = ()=>T
type updateFunction<T> = (val:T) => any

export class Binding<T> {
    private valueFunction:valueFunction<T>
    private update?:updateFunction<T>
    private subs:Subscription[] = []

    constructor(vf:valueFunction<T>, ...observables:(Observable|undefined)[]) {
        this.valueFunction = vf
        this.observe(...observables)
    }

    private refresh() {
        const newVal = this.valueFunction()
        this.update?.(newVal)
    }

    compute():T { return this.valueFunction() }

    /**
     * Set the target of the binding by providing a function, which will be called
     * whenever the binding is recomputed
     */
    onUpdate(updateFunction:updateFunction<T>|undefined) {
        this.update = updateFunction
        if (this.update)
            this.refresh() // refresh
    }

    /**
     * List additional observables, which will be watched for changes
     */
    observe(...observables:(Observable|undefined)[]) {
        // todo: should we store observables? this may be needed for pausing and resuming bindings
        //       without keeping subscriptions active
        const onChange = () => this.refresh()
        for (const obs of observables) {
            if (!obs) continue
            this.subs.push(obs.subscribe(onChange))
        }
    }

    dispose() {
        dispose(this.subs)
    }
}

export function bind<T>(valueFunction:valueFunction<T>, ...observables:(Observable|undefined)[]):Binding<T> {
    return new Binding(valueFunction, ...observables)
}