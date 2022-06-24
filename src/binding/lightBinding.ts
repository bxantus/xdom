// Light bindings are not really bindings, who watch for changes to occur before recomputing changes
// instead they are just functions (computations) which are executed repeatedly (mostly in each frame)
// and the new value is applied whenever the computed value changes.
// It is inspired by immeditae mode UIs, where the whole GUI is "recreated" in each frame, providing simple
// interaction and binding to model values with the cost of a bit CPU overhead (which is already needed for preparaing the new frames).

import { KeysMatching } from "./binding.ts";

type CalculatedValue<T> = ()=>T
interface CustomProperty<T> {
    get:()=>T
    set:(val:T)=>any
} 
export interface LightBinding<T> {
    prop:string|symbol|number|CustomProperty<T>
    calc:CalculatedValue<T>
}

export class Repository {
    bindings = new Map<any, LightBinding<any>[]>()

    add<T>(obj:any, prop:string|symbol|number|CustomProperty<T>, calc:CalculatedValue<T>|undefined) {
        if (!calc) return
        const list = this.bindings.get(obj)
        const binding:LightBinding<T> = { prop, calc }
        if (!list) {
            this.bindings.set(obj, [binding])
        } else list.push(binding)
        return binding
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
            updatePropValue(obj, lb)
        }
    }
}

function updatePropValue<T>(obj:any, lb:LightBinding<T>) {
    const newVal = lb.calc()
    if (typeof lb.prop == "object") { // custom prop
        const currentVal = lb.prop.get()
        if (currentVal != newVal)
            lb.prop.set(newVal)
    } else if (obj[lb.prop] != newVal)
        obj[lb.prop] = newVal 
}

export function calcProperty<Target, V>(obj:Target, prop:KeysMatching<Target, V>, calc:CalculatedValue<V>, repo?:Repository) {
    (obj as any)[prop] = calc()
    repo?.add(obj, prop, calc)
}

export function calcCustomProperty<Target, V>(obj:Target, customProp:CustomProperty<V>, calc:CalculatedValue<V>, repo?:Repository) {
    updatePropValue(obj, { prop:customProp, calc })
    repo?.add(obj, customProp, calc)
}
