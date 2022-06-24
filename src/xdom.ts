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
    onClick?:(this:HTMLElement, ev: MouseEvent)=>void
    // todo: needs more event handlers: focus events, key events, input events, animation events
}

type Children = (HTMLElement|string)[]
export function el<K extends TagNames>(tagname:K, props?:ElementProps, ...children:Children):HTMLElementTagNameMap[K] {
    const result = document.createElement(tagname)
    const element = result as HTMLElement
    if (props?.id)
        element.id = props.id
    if (props?.class)
        setProperty(element, "className", props.class)
    if (props?.innerText)
        setProperty(element, "innerText", props.innerText)
    if (props?.onClick)
        element.onclick = ev => props.onClick!.call(element, ev)
    
    if (children)
        element.append(...children)
    return result
} 
export function div(props:ElementProps, ...children:Children) {
    return el("div", props, ...children) as HTMLDivElement
}

export function span(props:ElementProps, ...children:Children) {
    return el("span", props, ...children) as HTMLSpanElement
}

interface ImgProps extends ElementProps {
    src?:PropertyValue<string> /// used by img elements
}

export function img(props:ImgProps, ...children:Children) {
    const img = el("img", props, ...children)
    if (props?.src)
        setProperty(img, "src", props.src)
    return img
}

interface InputProps extends ElementProps {
    type?:string /// used by input elements
    checked?:PropertyValue<boolean>
    value?:PropertyValue<string>
    onInput?:(this:HTMLInputElement, ev:Event)=>any
    onChange?:(this:HTMLInputElement, ev:Event)=>any
}

export function input(props:InputProps, ...children:Children) {
    const element = el("input", props, ...children)
    if (props.type )
        element.type = props.type
    if (props.checked != undefined)
        setProperty(element, "checked", props.checked)
    if (props.value)
        setProperty(element, "value", props.value)
    if (props.onInput)
        element.oninput = ev => props.onInput!.call(element, ev)
    if (props.onChange)
        element.onchange = ev => props.onChange!.call(element, ev)

    return element
}

interface LabelProps extends ElementProps {
    for?:string /// id of asociated element for label
}

export function label(props:LabelProps, ...children:Children) {
    const element = el("label", props, ...children)
    if (props?.for && element instanceof HTMLLabelElement) {
        element.htmlFor = props.for
    }
    return element
}

interface SelectProps extends ElementProps {
    value?:PropertyValue<string>
    onInput?:(this:HTMLSelectElement, ev:Event)=>any
    onChange?:(this:HTMLSelectElement, ev:Event)=>any
}

export function select(props:SelectProps, ...children:Children) {
    const element = el ("select", props, ...children)
    if (props?.value)
        setProperty(element, "value", props.value)
    if (props.onInput)
        element.oninput = ev => props.onInput!.call(element, ev)
    if (props.onChange)
        element.onchange = ev => props.onChange!.call(element, ev)
    return element
}

interface OptionProps extends ElementProps {
    selected?:PropertyValue<boolean>
    value?:PropertyValue<string>
}

export function option(props:OptionProps, ...children:Children) {
    const element = el("option", props, ...children) 
    if (props?.selected) {
        setProperty(element, "selected", props.selected)
    }
    if (props?.value)
        setProperty(element, "value", props.value)
    return element
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