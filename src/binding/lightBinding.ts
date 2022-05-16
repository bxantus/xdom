// Light bindings are not really bindings, who watch for changes to occur before recomputing changes
// instead they are just functions (computations) which are executed repeatedly (mostly in each frame)
// and the new value is applied whenever the computed value changes.
// It is inspired by immeditae mode UIs, where the whole GUI is "recreated" in each frame, providing simple
// interaction and binding to model values with the cost of a bit CPU overhead (which is already needed for preparaing the new frames).

import { KeysMatching } from "./binding.ts";

type CalculatedValue<T> = ()=>T 
export interface LightBinding<T> {
    prop:string|symbol|number
    calc:CalculatedValue<T>
}

export class Repository {
    bindings = new Map<any, LightBinding<any>[]>()

    add(obj:any, prop:string|symbol|number, calc:CalculatedValue<any>|undefined) {
        if (!calc) return
        const list = this.bindings.get(obj)
        const binding:LightBinding<any> = { prop, calc }
        if (!list) {
            this.bindings.set(obj, [binding])
        } else list.push(binding)
    }

    clearForObject(obj:any) {
        this.bindings.delete(obj)
    }

    has(obj:any) { return this.bindings.has(obj) }

    // refreshes all calculated bindings for object
    refresh(obj:any) {
        const list = this.bindings.get(obj)
        if (!list) return
        for (const lb of list) {
            const newVal = lb.calc()
            if (obj[lb.prop] != newVal)
                obj[lb.prop] = newVal 
        }
    }
}

export function calcProperty<Target, V>(obj:Target, prop:KeysMatching<Target, V>, calc:CalculatedValue<V>, repo?:Repository) {
    (obj as any)[prop] = calc()
    repo?.add(obj, prop, calc)
}
