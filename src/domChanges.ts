// This module handles changes in the dom coming from recurring computations, light bindings, bindings and list changes
// If you use xdom, change detection will be activated automatically by it
import { BindingsForObject, LightBinding } from "./binding/lightBinding.ts"
import { Disposable } from "./dispose.ts";
import { hide, show, XDListener } from "./xdom.ts";


/// XDOM Node
class XDNode {
    private isVisible = true    // current effective visibility
    private isConnected = false // becomes true when the associated element will be attached to the DOM
    // if this node has an associated visible binding, it can be checked and refreshed here
    visibleBinding?:LightBinding<boolean>
    bindings?:BindingsForObject<HTMLElement, any>
    
    get visible() { return this.isVisible }
    
    updateVisible() {
        const oldVisible = this.isVisible
        if (!this.visibleBinding) {
            this.isVisible = true // may have been part of an invisible subtree previously
        } else this.isVisible = this.visibleBinding.calc.compute()
        
        if (oldVisible == this.isVisible) return 
        // visibility has been changed
        if (this.isVisible) {
            this.connected()
        } else {
            // invisible subtree. NOTE: this only happens for nodes with visibleBindings attached to them
            // we will act if the node gets disconnected with the whole subtree from the DOM
            for (const node of XDNode.nodesOfTree(this)) {
                node.isVisible = false
                node.disconnected()
            }
        }
        if (this.visibleBinding) { // show/hide should be called only for elements with visible bindings, html takes care of the rest of hiding/showing the subtree
            const element = this.bindings?.objRef.deref()
            if (!element) return
            if (this.isVisible) show(element)
            else hide(element)
        }
    }

    listeners?:XDListener[]

    addListener(listener:XDListener) {
        if (this.isConnected) // fire connected for the listener
            listener.onConnected()
        if (!this.listeners)
            this.listeners = [listener]
        else this.listeners.push(listener)
    }

    constructor(forElement?:HTMLElement) {
        if (forElement)
        this.bindings = new BindingsForObject(forElement)
    }
    
    // child manipulation
    children:XDNode[] = []
    /// returns the newly added node
    addChild(node:XDNode) {
        this.children.push(node)
        if (!this.isVisible)
            node.isVisible = false // when this node is hidden it updates the effective visibility of the child
        else if (node.isVisible) // only visible nodes get connected
            node.connected()
        return node
    }

    removeChild(node:XDNode) {
        const nodeIdx = this.children.indexOf(node)
        this.children.splice(nodeIdx, 1) // this removes the whole subtree together with node
        
        node.removeSubTree()
    }

    // remove and disconnect all nodes of this subtree starting with this one 
    private removeSubTree() { 
        this.disconnected()
        // will remove the whole subtree, and their children as they can be mutated outside of our mutation observer
        // so the tree has to be rebuilt fully on insertion
        for (const child of this.children)
            child.removeSubTree()
        this.children.splice(0, Infinity)
    }

    /// iterable preorder travelsal for all children of the given node
    static *nodesOfTree(node:XDNode):Generator<XDNode> {
        yield node;
        for (const child of node.children)
            yield* XDNode.nodesOfTree(child)
    }

    /// called when this xdnode is connected to the DOM
    private connected() {
        if (this.isConnected) return
        this.isConnected = true
        if (!this.listeners) return
        for (const l of this.listeners)
            l.onConnected()
    }

    /// called when this xdnode is disconnected from the DOM
    private disconnected() {
        if (!this.isConnected) return
        this.isConnected = false
        if (!this.listeners) return
        for (const l of this.listeners)
            l.onDisconnected()
    }
}

/// XDOM tree, provides quick access to its nodes by id
/// also the nodes are organized in a tree aiding traversal when evaluating bindings
class XDTree {
    root:XDNode
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
const onscreenNodes = new XDTree()

export const getOrCreateXdNodeForElement= (el:HTMLElement) => onscreenNodes.getOrCreateForElement(el)

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
        xdomParent = xdomParent.addChild(xdNode)
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
        xdomParent.removeChild(xdNode) // NOTE: this removes all children as well
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
