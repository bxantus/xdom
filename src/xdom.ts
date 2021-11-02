// DOM related utility library

type TagNames = keyof HTMLElementTagNameMap

interface ElementProps {
    class?: string
    innerText?:string
    onClick?:(ev: MouseEvent)=>void
}

export function el(tagname:TagNames, props?:ElementProps, children?:(HTMLElement|string)[]) {
    const element = document.createElement(tagname)
    if (props?.class)
        element.className = props.class
    if (props?.innerText)
        element.innerText = props.innerText
    if (props?.onClick)
        element.onclick = props.onClick
    if (children)
        element.append(...children)
    return element
} 