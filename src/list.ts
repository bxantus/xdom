import { calcProperty } from "./binding/lightBinding.ts"
import { Disposable } from "./dispose.ts";
import { scheduleRecurringUpdate, disposeTree, registerDisposer } from "./domChanges.ts";

type templateFunc<ET> = (item:ET)=>HTMLElement

/**
 * 
 * @param listHead element conatining the list items, list manages items in listHead, it should have no children, or they will be dropped
 * @param items model for the items, which will be displayed
 * @param template function (or componenet class-like) which displays a given item
 */
export function listItems<ET>(listHead:HTMLElement, items:Array<ET>, template:templateFunc<ET>) {
    if (listHead.children.length > 0) {
        console.error("Element specified for listhead should not have any children", listHead)
        listHead.replaceChildren()
    }
    // will schedule computation checked by xdom in each frame, in the case of observable lists
    const updater = new ListUpdater(listHead, items, template)
    registerDisposer(listHead, updater)
    updater.update()
    
    return listHead
}

enum UpdateStrategy {
    Static,     // list is treated as a static list, it won't be checked for changes
    AddOrRemove, // list items are only newly added or removed from the list in each update from the end
    Full,       // list can change fully and randomly
}

class ListUpdater<ET> {
    updateHandle:Disposable
    constructor(private listHead:HTMLElement, items:ET[], private template:templateFunc<ET>) {
        this._items = items
        // TODO: it makes sense to recalc changes only for observable lists
        //        and treat arrays as Static (won't change, use only once for list items) 
        // TODO: this is just a test, it isn't an effective list implementation 
        this.updateHandle = scheduleRecurringUpdate(()=> {
            this.update()
        })
    }
    private _items:ET[] = []
    get items() { return this._items }
    set items(items:ET[]) {

    }

    private lastPass:ET[] = []
    update() {
        this.lastPass = updateList(this.listHead, this.lastPass, this.items, this.template)
    }

    dispose() {
        this.updateHandle.dispose()
    }
}

function updateList<ET>(listHead:HTMLElement, lastPass:ET[], items:ET[], template:templateFunc<ET>) {
    let count = Math.min(lastPass.length, items.length)
    
    for (let i = 0; i < count; ++i) {
        if (lastPass[i] != items[i]) { // item change detected
            // could search for the next match in items, for lastPass[i], at index k
            // elements between [i,k) would have to be created again from items, and inserted before listHead.children[i]
            // but if the item is replaced, lists aren't shifted, then only this element should be rerendered
            // it would make sense to calculate the largest overlaps in both lists and only change elements where needed
            // like some maxmatch algo

            // currently we will rerender elements from i
            removeChildrenInRange(listHead, {start:i, end:listHead.children.length})
            const pass:ET[] = items.slice(0, i)
            renderElements(listHead, items, {start:i, end:items.length}, template, pass)
            return pass
        }
    }
    if (items.length < lastPass.length) {
        // drop last items
        for (let i = lastPass.length - 1; i >= items.length; --i) {
            disposeTree(listHead.children[i])
            listHead.children[i].remove()
        }
        lastPass.splice(items.length, lastPass.length - items.length)
        return lastPass
    } else if (items.length > lastPass.length) {
        // add new items
        renderElements(listHead, items, {start:lastPass.length, end:items.length}, template, lastPass)
        return lastPass
    }
    return lastPass // nothing changed
}

interface Range {
    start:number
    end:number // exclusive
}

/**
 * 
 * Newly rendered items will be added to pass (can be used in the next check)
 * Assumes listHead has at least start children already!
 */
function renderElements<ET>(listHead:HTMLElement, items:ET[], range:Range, template:templateFunc<ET>, pass:ET[]) {
    const insertLocation = {
        element: range.start < listHead.children.length ? listHead.children[range.start] : listHead,
        method: range.start < listHead.children.length ? "afterend" : "beforeend" as InsertPosition
    }

    for (let i = range.start; i < range.end; ++i) {
        const newElement = template(items[i])
        insertLocation.element.insertAdjacentElement(insertLocation.method, newElement)
        pass.push(items[i])
        insertLocation.element = newElement
        insertLocation.method = "afterend"
    }
    
}

function removeChildrenInRange(listHead:HTMLElement, range:Range) {
    const end = Math.min(listHead.children.length, range.end)
    for (let i = end - 1; i >= range.start; --i) {
        disposeTree(listHead.children[i])
        listHead.children[i].remove()
    }
}