// This module handles changes in the dom coming from recurring computations, light bindings, bindings and list changes
// If you use xdom, change detection will be activated automatically by it
import { BindingsForObject, LightBinding } from "./binding/lightBinding.ts"
import { Disposable } from "./dispose.ts";


/// XDOM Node
class XDNode {
    private isVisible = true
    // if this node has an associated visible binding, it can be checked and refreshed here
    visibleBinding?:LightBinding<boolean>
    bindings?:BindingsForObject<HTMLElement, any>
    
    get visible() { return this.isVisible }
    updateVisible() {
        if (!this.visibleBinding) return
        this.isVisible = this.visibleBinding.calc.compute()
    }


    children:XDNode[] = []
    constructor(forElement?:HTMLElement) {
        if (forElement)
            this.bindings = new BindingsForObject(forElement)
    }

    // child manipulation
    /// returns the newly added node
    add(node:XDNode) {
        this.children.push(node)
        return node
    }

    remove(node:XDNode) {
        const nodeIdx = this.children.indexOf(node)
        this.children.splice(nodeIdx, 1) // this removes the whole subtree together with node
        // will remove the whole subtree, and their children as they can be mutated outside of our mutation observer
        // so the tree has to be rebuilt fully on insertion
        for (const n of XDNode.nodesOfTree(node))
            n.children.splice(0) // remove all children
    }

    /// iterable preorder travelsal for all children of the given node
    static *nodesOfTree(node:XDNode):Generator<XDNode> {
        yield node;
        for (const child of node.children)
            yield* XDNode.nodesOfTree(child)
    }
}

/// XDOM tree, provides quick access to its nodes by id
/// also the nodes are organized in a tree aiding traversal when evaluating bindings
class XDTree {
    root:XDNode
    nodesById = new Map<string, XDNode>()
    private nodesByElement = new WeakMap<HTMLElement, XDNode>()

    constructor() {
        this.root = new XDNode()
    }

    getForElement(el:HTMLElement) {
        return this.nodesByElement.get(el)
    }

    getOrCreateForElement(el:HTMLElement) {
        let node = this.nodesByElement.get(el)
        if (node) return node
        node = new XDNode(el)
        this.nodesByElement.set(el, node)
        return node
    }

    // todo: should provide a listener interface for node additon and removal
    //       as associated resources and components can update there: stop listening for events
    //       and also release, gather associated resources
}

// this tree represents those xdom elements which are attached to the DOM (in the subtree of document.body)
export const onscreenNodes = new XDTree()

// handling light bindings
// NOTE: this code refreshes all the light bindings for onscreen nodes in preorder.
function refreshProps(xdNode:XDNode) {
    xdNode.updateVisible()
    if (!xdNode.visible)
        return 0
    let numRefreshed = 0
    if (xdNode.bindings) {
        xdNode.bindings.refresh()
        numRefreshed++
    }
    for (const child of xdNode.children) {
        numRefreshed += refreshProps(child)
    }
    return numRefreshed
}

function refresh(time: DOMHighResTimeStamp) {
    requestAnimationFrame(refresh)  // set up for the next frame
    updateStats(time)
    // run updates, newly scheduled updates while running will be run in the next frame, if not requested otherwise
    const numUpdates = updates.length
    for (let i = 0; i < numUpdates; ++i) {
        updates[i]()
    }
    updates.splice(0, numUpdates)

    // run recurring updates
    recurringState.running = true
    for (const r of recurring) {
        if (r.enabled) r.update()
    }
    recurringState.running = false
    // clean up updates stopped meanwhile
    if (recurringState.dirty) {
        recurring = recurring.filter(r=> r.enabled)
        recurringState.dirty = false
    }

    // refresh light bindings
    stats.numLightBoundObjects = refreshProps(onscreenNodes.root)
}

const updates:(()=>any)[] = []
interface RecurringUpdate {
    enabled:boolean
    update:()=>any
}

const recurringState = {
    running:false,
    dirty:false  // set to tru when updates removed while running
}
let recurring:RecurringUpdate[] = []

export function scheduleUpdate(update:()=>any) {
    // NOTE: if you need to schedule immediate updates (while running update loop)
    //       it has to be implemented here (why would you need it, you can run the code ASAP)
    updates.push(update)
}

export function scheduleRecurringUpdate(update:()=>any):Disposable {
    const recurringUpdate:RecurringUpdate = {
        enabled:true,
        update
    }
    recurring.push(recurringUpdate)
    return {
        dispose() {
            recurringUpdate.enabled = false
            if (recurringState.running) {
                recurringState.dirty = true
                return
            }
            const idx = recurring.indexOf(recurringUpdate)
            if (idx >= 0) recurring.splice(idx, 1)
        }
    }
}

/// getst the closes xdom parent of some element. elParent is already considered for this
function getXdomParent(elParent:HTMLElement|null) {
    for (; elParent; elParent = elParent.parentElement) {
        const parentNode = onscreenNodes.getForElement(elParent)
        if (parentNode) return parentNode
    }
    return onscreenNodes.root
}

const elementInserted = (element:HTMLElement, xdomParent:XDNode) => {
    const xdNode = onscreenNodes.getForElement(element)
    if (xdNode) 
        xdomParent = xdomParent.add(xdNode)
    // check all children elements as well having xdom nodes, this will rebuild the xdnode tree starting from element
    for (let idx = 0; idx < element.children.length; ++idx) {
        const child = element.children[idx]
        if (child instanceof HTMLElement)
            elementInserted(child, xdomParent)
    }
}

const elementRemoved = (element:HTMLElement, xdomParent:XDNode) => {
    const xdNode = onscreenNodes.getForElement(element)
    if (xdNode) {
        xdomParent.remove(xdNode) // NOTE: this removes all children as well
    } else { // have to check children
        for (let idx = 0; idx < element.children.length; ++idx) {
            const child = element.children[idx]
            if (child instanceof HTMLElement)
                elementRemoved(child, xdomParent)
        }       
    }
}

const onDomMutated = (mutations: MutationRecord[], observer: MutationObserver) => {
    // NOTE: we will be notified on text node changes as well (mostly coming from text updates from calcs)
    const ELEMENT_NODE = 1
    for (const mut of mutations) {
        mut.addedNodes.forEach(node => {
            if (node.nodeType == ELEMENT_NODE && node instanceof HTMLElement) 
                elementInserted(node, getXdomParent( mut.target as HTMLElement))    
        })
        mut.removedNodes.forEach(node=> {
            if (node.nodeType == ELEMENT_NODE && node instanceof HTMLElement) 
                elementRemoved(node, getXdomParent( mut.target as HTMLElement))    
        })
    }
}

const domObserver = new MutationObserver(onDomMutated)
let refreshHandle:number|undefined = undefined

export function startObservingChanges() {
    if (refreshHandle != undefined) // already started once 
        return
    refreshHandle = requestAnimationFrame(refresh)
    window.addEventListener("load", evt => {
        // may observe later the full document if needed
        domObserver.observe(document.body, { // monitoring the dom tree of child additions and removals
            subtree: true,
            childList: true
        })
    })
}


// TODO: elementRepository will be transformed to contain various things attached to an xdom element
//       the key will be element id, it can have a component registered, and maybe multiple disposers (or resources) listed.
//       One such resource can be the lister attached to the list head
//       These will be notified the wlement is detached, when it is attached and when the whole stuff is diposed of
//       This should be renamed probably to attachedResources. Components should have an easy API to register themselves with their
//       head element 
const elementRepository = new Map<any, Disposable>()

// When resources for e are cleared (like the dom tree is released), disposer will be run
// TODO: rename it to registerResource/or component
export function registerDisposer(e:any, disp:Disposable) {
    // NOTE: hopefully only one disposer will be registered for each element...
    if (elementRepository.has(e))
        console.error("Element has already registered a disposer, this will be overwritten now!", {
            element:e, disposer: elementRepository.get(e)
        })

    elementRepository.set(e, disp)
}

// todo: this function will be removed when associated resources will be refreshed on node addition and removal
//       see the todos above regarding element repo
export function disposeTree(root:Element) {
    // first children are disposed, so manipulating child items from dipose won't interfere with releasing resources
    for (let child = root.firstElementChild; child ; child = child.nextElementSibling) {
        disposeTree(child)
    }

    const disp = elementRepository.get(root)
    if (disp) {
        disp.dispose()
        elementRepository.delete(root)
    }
}

// Statistics  ------------------------------------------------------------------------------------------------
export const stats = {
    timestamp: 0, ///< the current timestamp, it can be used in calculations to update something continously (like modulate the colors etc.)
    numLightBoundObjects: 0,
    numRecurringUpdates: recurring.length,
    fps: 60,
}

let fpsWindowStart:number|undefined = undefined
let framesInWindow = 0  // frames ellapsed since fpsWindow started
const fpsWindowSize = 200 // will update fps each 200 ms

function updateStats(timestamp:number) {
    stats.timestamp = timestamp
    stats.numLightBoundObjects = onscreenNodes.nodesById.size
    stats.numRecurringUpdates = recurring.length
    
    if (fpsWindowStart === undefined) {
        fpsWindowStart = timestamp
    } else {
        const fpsWindow = timestamp - fpsWindowStart
        framesInWindow++
        if (fpsWindow >= fpsWindowSize) {
            stats.fps = Math.round(framesInWindow * 1000 / fpsWindow)
            framesInWindow = 0
            fpsWindowStart = timestamp
        }
    }   
}
