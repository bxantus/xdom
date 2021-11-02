// DOM related utility library

type TagNames = keyof HTMLElementTagNameMap

interface ElementProps {
    class?: string
}

export function el(tagname:TagNames, props?:ElementProps) {
    const element = document.createElement(tagname)
    if (props?.class)
        element.className = props.class
    return element
} 