// other exports
export { dispose, make } from "./dispose.ts"
export { calc, type KeysMatching } from "./binding/lightBinding.ts"
// DOM related utility library
import { calcCustomProperty, calcProperty, type KeysMatching, CalculatedValue } from "./binding/lightBinding.ts"
import { lightBindings, startObservingChanges } from "./domChanges.ts"

type TagNames = keyof HTMLElementTagNameMap
export type CalcOrValue<T> = T | CalculatedValue<T>
type PropertyValue<T> = CalcOrValue<T> 

interface ElementProps<Element> {
    id?:string
    class?: PropertyValue<string>
    text?:PropertyValue<string|null> 
    visible?:CalcOrValue<boolean>
    onClick?:(this:Element, ev: MouseEvent)=>void
    // todo: needs more event handlers: focus events, key events, input events, animation events
}

/**
 * Components can be any kind of objects, they are only required to provide an element property
 */
interface Component {
    element:HTMLElement
}

type Children = (HTMLElement|Component|string|undefined)[]
export function el<K extends TagNames>(tagname:K, props?:ElementProps<HTMLElementTagNameMap[K]>, ...children:Children):HTMLElementTagNameMap[K] {
    const result = document.createElement(tagname)
    const element = result as HTMLElement
    if (props?.id)
        element.id = props.id
    if (props?.class)
        setProperty(element, "className", props.class)
    if (props?.text)
        setProperty(element, "textContent", props.text)
    if (props?.onClick)
        element.onclick = ev => props.onClick!.call(result, ev)
    if (props?.visible != undefined) {
        if (props.visible instanceof CalculatedValue) {
            // NOTE: attaches a custom computed property to this element which has it's own getter/setter
            //       when the tree is diposed this lightbinding with the customProperty holder will be removed from lightBindings
            const visibilityUpdater = {
                name: "visible",
                visible: true,
                get() { return this.visible },
                set(v:boolean) { this.visible = v; v ? show(element) : hide(element) }
            }
            calcCustomProperty(element, visibilityUpdater, props.visible, lightBindings)
        } else if (!props.visible) hide()
    }
    
    if (children) {
        for (const child of children) {
            if (!child) continue
            if (typeof child == "string" || child instanceof HTMLElement)
                element.append(child)
            else element.append(child.element)
        }
    }
    return result
} 
export function div(props:ElementProps<HTMLDivElement>, ...children:Children) {
    return el("div", props, ...children)
}

export function span(props:ElementProps<HTMLSpanElement>, ...children:Children) {
    return el("span", props, ...children) as HTMLSpanElement
}

interface ImgProps extends ElementProps<HTMLImageElement> {
    src?:PropertyValue<string> /// used by img elements
}

export function img(props:ImgProps, ...children:Children) {
    const img = el("img", props, ...children)
    if (props?.src)
        setProperty(img, "src", props.src)
    return img
}

interface InputProps extends ElementProps<HTMLInputElement> {
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

interface LabelProps extends ElementProps<HTMLLabelElement> {
    for?:string /// id of asociated element for label
}

export function label(props:LabelProps, ...children:Children) {
    const element = el("label", props, ...children)
    if (props?.for && element instanceof HTMLLabelElement) {
        element.htmlFor = props.for
    }
    return element
}

interface SelectProps extends ElementProps<HTMLSelectElement> {
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

interface OptionProps extends ElementProps<HTMLOptionElement> {
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
    if (val instanceof CalculatedValue) 
        calcProperty(obj, prop, val, lightBindings)
    /// @ts-ignore: obj[prop] is perfectly valid, as prop is guaranteed to be some prop of obj (maybe not true for readonly)    
    else obj[prop] = val 
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