// other exports
export { dispose, make } from "./dispose.ts"
// DOM related utility library
import { BindingOrValue, bind, BindingRepository, type KeysMatching } from "./binding/binding.ts"
import { calcProperty } from "./binding/lightBinding.ts"
import { lightBindings, startObservingChanges, bindingRepo } from "./domChanges.ts"

type TagNames = keyof HTMLElementTagNameMap
type PropertyValue<T> = BindingOrValue<T> | (() => T) 

interface ElementProps {
    id?:string
    class?: PropertyValue<string>
    innerText?:PropertyValue<string>
    onClick?:(ev: MouseEvent)=>void
    // todo: needs more event handlers: focus events, key events, input events, animation events
    
    src?:PropertyValue<string> /// used by img elements
    // input element specific
    type?:string /// used by input elements
    checked?:PropertyValue<boolean>
    for?:string /// id of asociated element for label
    value?:PropertyValue<string>
    // option elements
    selected?:PropertyValue<boolean>
}

export function el<K extends TagNames>(tagname:K, props?:ElementProps, ...children:(HTMLElement|string)[]):HTMLElementTagNameMap[K] {
    const result = document.createElement(tagname)
    const element = result as HTMLElement
    if (props?.id)
        element.id = props.id
    if (props?.class)
        setProperty(element, "className", props.class)
    if (props?.innerText)
        setProperty(element, "innerText", props.innerText)
    if (props?.onClick)
        element.onclick = props.onClick
    if (props?.src && element instanceof HTMLImageElement)
        setProperty(element, "src", props.src)
    if (element instanceof HTMLInputElement) {
        if (props?.type )
            element.type = props.type
        if (props?.checked != undefined)
            setProperty(element, "checked", props.checked)
        
    }
    if (props?.for && element instanceof HTMLLabelElement) {
        element.htmlFor = props.for
    }
    if (props?.value && (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLOptionElement))
        setProperty(element, "value", props.value)
    if (props?.selected && element instanceof HTMLOptionElement) {
        setProperty(element, "selected", props.selected)
    }
    if (children)
        element.append(...children)
    return result
} 
export function div(props:ElementProps, ...children:(HTMLElement|string)[]) {
    return el("div", props, ...children) as HTMLDivElement
}

export function span(props:ElementProps, ...children:(HTMLElement|string)[]) {
    return el("span", props, ...children) as HTMLSpanElement
}

export function img(props:ElementProps, ...children:(HTMLElement|string)[]) {
    return el("img", props, ...children) as HTMLImageElement
}


function setProperty<Target, V>(obj:Target, prop:KeysMatching<Target, V>, val:PropertyValue<V>) {
    if (val instanceof Function) 
        calcProperty(obj, prop, val, lightBindings)
    else bind(obj, prop, val, bindingRepo) 
}


/// timeout used to schedule a class change to start a transition
/// right after the element is added to DOM
/// timeout is needed, so browsers don't cache and merge style changes right after creating the element
const INITIAL_CLASS_CHANGE_TIMEOUT = 50 // NOTE: not sure if timeuts smaller than this, will work

export function scheduleTransitionByClassChange(el:HTMLElement, className:string) {
    setTimeout(()=> el.classList.toggle(className), INITIAL_CLASS_CHANGE_TIMEOUT) 
}

export function scheduleTransition(func:()=>any) {
    setTimeout(func, INITIAL_CLASS_CHANGE_TIMEOUT) 
}

export function setClassIf(element:HTMLElement, condition:boolean, className:string) {
    if (condition) element.classList.add(className)
    else element.classList.remove(className)
}


// utilities

export function hide(...elements:HTMLElement[]) {
    for (const element of elements)
        element.style.display = 'none'
}

export function show(...elements:HTMLElement[]) {
    for (const element of elements)
        element.style.display = ''
}


// boot code 
startObservingChanges()