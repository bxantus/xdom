// Part of components sample
// Contains sample/test code for custom user created XDOM components

import { listItems } from "../src/list.ts";
import { ObservableList } from "../src/objects/observableList.ts";
import { div, span, calc, ElementChild, disposeTree, registerDisposer } from "../src/xdom.ts";

interface AppDesc {
    label:string
    icon?:string // will be defaulted
    action?:()=>void

}

interface AppBarProps {
    apps: AppDesc[]|ObservableList<AppDesc>
    defaultIcon?:string
}

/// Inspired from material navigation bar component: https://m3.material.io/components/navigation-bar/guidelines
class AppBar {
    element = div({class: "appbar"})
    private selectedApp?:AppDesc

    constructor(props:AppBarProps) {
        const apps = (props.apps instanceof ObservableList) ? props.apps : ObservableList.from(props.apps)
        listItems(this.element, apps, this.appTemplate)

        // todo: should attach itself to the dom if possible, and should be disposed at the end
    }

    /**
     * This function is used to display the list of apps inside the appbar
     */
    private appTemplate = (app:AppDesc) => span({
            class: calc(()=> `app-destination flexible vertical ${app == this.selectedApp ? "selected" : ""}`) , 
            onClick:()=> this.appClicked(app)
        },
        span({class: "icon", text: app.icon}),
        span({class: "label", text: app.label})
    )

    private appClicked(app:AppDesc) {
        if (this.selectedApp == app) 
            return
        this.selectedApp = app
        app.action?.()
    }
}

export const appBar = (props:AppBarProps) => new AppBar(props)

interface ControllerProps {
    root?:HTMLElement
    initialContent?:ElementChild|ElementBuilder
}

type ElementBuilder = ()=>ElementChild

/// Controller switches between dom fragments (or trees)
/// You can provide a custom root element for it, by default a simple div will be created
class Controller {
    private stack:(ElementChild|ElementBuilder)[] = []
    element:HTMLElement

    constructor(props:ControllerProps) {
        this.element = props.root ?? div({})
        if (props.initialContent) {
            this.next(props.initialContent)
        }

        // NOTE: tries to attach itself to the dom (to root element), and should be disposed at the end
        registerDisposer(this.element, this)
    }

    dispose() {

    }

    /// Pushes el as the next element on the stack
    next(el:ElementChild|ElementBuilder) {
        this.stack.push(el)
        this.display(el)
    }

    /// Goes back to the previous element
    prev() {
        if (this.stack.length == 0) return
        this.stack.pop()
        if (this.stack.length == 0) {
            this.display(undefined)
            return
        }
        
        const el = this.stack[this.stack.length - 1]
        this.display(el)
    }

    private display(el:ElementChild|ElementBuilder) {
        if (this.element.childElementCount > 0) {
            // todo: should only dispose when it will be recreated by an elementBuilder
            //       controller only can pause bindings otherwise elements won't be reusable
            // disposeTree(this.element.children[0]) // only one child
        }
        
        const newContent = el instanceof Function ? el() : el
        if (newContent)
            this.element.replaceChildren(newContent instanceof HTMLElement || typeof newContent == "string" ? newContent : newContent.element)
    }
}

export const controller = (props:ControllerProps) => new Controller(props)