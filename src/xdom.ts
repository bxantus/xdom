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