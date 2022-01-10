// DOM related utility library

type TagNames = keyof HTMLElementTagNameMap

interface ElementProps {
    class?: string
    innerText?:string
    onClick?:(ev: MouseEvent)=>void
    src?:string /// used by img elements
}

export function el(tagname:TagNames, props?:ElementProps, children?:(HTMLElement|string)[]) {
    const element = document.createElement(tagname)
    if (props?.class)
        element.className = props.class
    if (props?.innerText)
        element.innerText = props.innerText
    if (props?.onClick)
        element.onclick = props.onClick
    if (props?.src && element instanceof HTMLImageElement)
        element.src = props.src
    if (children)
        element.append(...children)
    return element
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