import { Observable, Subscription } from "./subscriptions.ts"
import { dispose } from "../base.ts"

type valueFunction<T> = ()=>T
type updateFunction<T> = (val:T) => any

// see: https://stackoverflow.com/a/54520829, keys of T having type of V
type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

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

    bindTo<Target>(target:Target, prop:KeysMatching<Target, T>) {
        this.onUpdate(v => (target as any)[prop] = v)
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


export function binding<T>(valueFunction:valueFunction<T>, ...observables:(Observable|undefined)[]):Binding<T> {
    return new Binding(valueFunction, ...observables)
}

export type BindingOrValue<T> = Binding<T> | T

export function getValue<T>(v:BindingOrValue<T>):T {
    return v instanceof Binding ? v.compute() : v
}

export function bind<V, Target>(target:Target, prop:KeysMatching<Target, V>, v:BindingOrValue<V>, repo?:BindingRepository<any>) {
    if (v === undefined) return
    if (v instanceof Binding) {
        v.bindTo(target, prop)
        repo?.add(target, v)
        return v
    }
    else (target as any)[prop] = v
}

export class BindingRepository<K> {
    bindings = new Map<K, Binding<any>[]>()

    add(obj:K, binding:Binding<any>|undefined) {
        if (!binding) return
        const list = this.bindings.get(obj)
        if (!list) {
            this.bindings.set(obj, [binding])
        } else list.push(binding)
    }

    clearBindings(obj:K) {
        const list = this.bindings.get(obj)
        if (!list) return 
        for (const b of list) 
            b.dispose()
        this.bindings.delete(obj)
    }
}