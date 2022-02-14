// other exports
export { dispose, make } from "./dispose.ts"
// DOM related utility library
import { BindingOrValue, bind, BindingRepository } from "./binding/binding.ts"

type TagNames = keyof HTMLElementTagNameMap

interface ElementProps {
    id?:string
    class?: BindingOrValue<string>
    innerText?:BindingOrValue<string>
    onClick?:(ev: MouseEvent)=>void
    src?:BindingOrValue<string> /// used by img elements
}

const bindingRepo = new BindingRepository<HTMLElement>()

export function el(tagname:TagNames, props?:ElementProps, children?:(HTMLElement|string)[]) {
    const element = document.createElement(tagname)
    if (props?.id)
        element.id = props.id
    if (props?.class)
        bind(element, "className", props.class, bindingRepo)
    if (props?.innerText)
        bind(element, "innerText", props.innerText, bindingRepo)
    if (props?.onClick)
        element.onclick = props.onClick
    if (props?.src && element instanceof HTMLImageElement)
        bind(element, "src", props.src, bindingRepo)
    if (children)
        element.append(...children)
    return element
} 

export function clearBindings(e:HTMLElement) {
    bindingRepo.clearBindings(e)
}

export function clearBindingsOfTree(root:HTMLElement) {
    clearBindings(root)
    for (let child = root.firstElementChild; child && child instanceof HTMLElement ; child = child.nextElementSibling) {
        clearBindingsOfTree(child)
    }
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