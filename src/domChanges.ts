// This module handles changes in the dom coming from recurring computations, light bndings, bindings and list changes
// If you use xdom, change detection will be activated automatically by it
import { BindingRepository } from "./binding/binding.ts";
import { Repository as LightBindings } from "./binding/lightBinding.ts"
import { Disposable } from "./dispose.ts";

export const lightBindings = new LightBindings()

// handling light bindings
function refreshProps() {
    // todo: just quick test, refreshing all the light bindings, in no specific order
    //       should traverse affected nodes in the dom instead, and refresh accordingly
    for (const obj of lightBindings.bindings.keys()) {
        lightBindings.refresh(obj)
    }
}

function refresh(time: DOMHighResTimeStamp) {
    requestAnimationFrame(refresh)  // set up for the next frame
    // run updates, newly scheduled updates while running will be run in the next frame, if not requested otherwise
    const numUpdates = updates.length
    for (let i = 0; i < numUpdates; ++i) {
        updates[i]()
    }
    updates.splice(0, numUpdates)

    // run recurring updates
    recurringState.running = true
    for (const r of recurring) {
        if (r.enabled) r.update()
    }
    recurringState.running = false
    // clean up updates stopped meanwhile
    if (recurringState.dirty) {
        recurring = recurring.filter(r=> r.enabled)
        recurringState.dirty = false
    }

    // refresh light bindings
    refreshProps()
}

const updates:(()=>any)[] = []
interface RecurringUpdate {
    enabled:boolean
    update:()=>any
}

const recurringState = {
    running:false,
    dirty:false  // set to tru when updates removed while running
}
let recurring:RecurringUpdate[] = []

export function scheduleUpdate(update:()=>any) {
    // NOTE: if you need to schedule immediate updates (while running update loop)
    //       it has to be implemented here (why would you need it, you can run the code ASAP)
    updates.push(update)
}

export function scheduleRecurringUpdate(update:()=>any):Disposable {
    const recurringUpdate:RecurringUpdate = {
        enabled:true,
        update
    }
    recurring.push(recurringUpdate)
    return {
        dispose() {
            recurringUpdate.enabled = false
            if (recurringState.running) {
                recurringState.dirty = true
                return
            }
            const idx = recurring.indexOf(recurringUpdate)
            if (idx >= 0) recurring.splice(idx, 1)
        }
    }
}

let refreshHandle:number|undefined = undefined

export function startObservingChanges() {
    if (refreshHandle == undefined)
        refreshHandle = requestAnimationFrame(refresh)
}

// handling normal bindings 
// NOTE: will we need them for property bindings later on?
export const bindingRepo = new BindingRepository<HTMLElement>()

export function clearBindings(e:HTMLElement) {
    bindingRepo.clearBindings(e)
}

export function clearBindingsOfTree(root:HTMLElement) {
    clearBindings(root)
    for (let child = root.firstElementChild; child && child instanceof HTMLElement ; child = child.nextElementSibling) {
        clearBindingsOfTree(child)
    }
}
