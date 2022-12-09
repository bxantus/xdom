// Light bindings are not really bindings, who watch for changes to occur before recomputing changes
// instead they are just functions (computations) which are executed repeatedly (mostly in each frame)
// and the new value is applied whenever the computed value changes.
// It is inspired by immediate mode UIs, where the whole GUI is "recreated" in each frame, providing simple
// interaction and binding to model values with the cost of a bit CPU overhead (which is already needed for preparaing the new frames).

// see: https://stackoverflow.com/a/54520829, keys of T having type of V
export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

export class CalculatedValue<T>  {
    constructor(public compute:()=>T) {}
}

export function calc<T>(compute:()=>T) {
    return new CalculatedValue(compute)
}

interface CustomProperty<T> {
    name:string
    get:()=>T
    set:(val:T)=>any
} 
export interface LightBinding<T> {
    prop:string|symbol|number|CustomProperty<T>
    calc:CalculatedValue<T>
}

export class BindingsForObject<T extends object, V> {
    objRef:WeakRef<T>
    bindings:LightBinding<V>[] = []
    constructor(obj:T, firstBinding?:LightBinding<V>) {
        this.objRef = new WeakRef(obj)
        if (firstBinding)
            this.bindings.push(firstBinding)
    }

    // refreshes all calculated bindings for objRef (if it's still alive)
    refresh() {
        // get object from weakref if possible
        const obj = this.objRef.deref()
        if (!obj) return
        for (const lb of this.bindings) {
            updatePropValue(obj, lb)
        }
    }
}

function updatePropValue<T>(obj:any, lb:LightBinding<T>) {
    const newVal = lb.calc.compute()
    if (typeof lb.prop == "object") { // custom prop
        const currentVal = lb.prop.get()
        if (currentVal != newVal)
            lb.prop.set(newVal)
    } else if (obj[lb.prop] != newVal)
        obj[lb.prop] = newVal 
}

