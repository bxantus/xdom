// This module handles changes in the dom coming from recurring computations, light bndings, bindings and list changes
// If you use xdom, change detection will be activated automatically by it
import { BindingRepository } from "./binding/binding.ts";
import { Repository as LightBindings } from "./binding/lightBinding.ts"

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

    refreshProps()
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
