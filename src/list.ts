import { Disposable } from "./dispose.ts";
import { scheduleUpdate } from "./domChanges.ts";
import { ObservableList } from "./objects/observableList.ts";
import { attachXdomListenerTo, XDListener } from "./xdom.ts";

type templateFunc<ET> = (item:ET)=>HTMLElement

/**
 * 
 * @param listHead element conatining the list items, list manages items in listHead, it should have no children, or they will be dropped
 * @param items model for the items, which will be displayed
 * @param template function (or componenet class-like) which displays a given item
 */
export function listItems<ET>(listHead:HTMLElement, items:ObservableList<ET>, template:templateFunc<ET>) {
    if (listHead.children.length > 0) {
        console.error("Element specified for listhead should not have any children", listHead)
        listHead.replaceChildren()
    }
    // will schedule computation checked by xdom in each frame, in the case of observable lists
    const updater = new ListUpdater(listHead, items, template)
    
    return listHead
}

class ListUpdater<ET> implements XDListener {
    listChanges?:Disposable
    constructor(private listHead:HTMLElement, items:ObservableList<ET>, private template:templateFunc<ET>) {
        this._items = items
        attachXdomListenerTo(listHead, this)
    }
    onConnected(): void {
        this.update() // update each time when connected, list could have changed meanwhile
        let updateScheduled = false
        this.listChanges = this.items.$changes.list.subscribe(()=>{
            if (updateScheduled)
                return
            scheduleUpdate(()=> {
                updateScheduled = false
                this.update()
            })
        })
    }
    onDisconnected(): void {
        this.listChanges?.dispose()
    }

    private _items:ObservableList<ET>
    get items() { return this._items }
    
    private lastPass:ET[] = []
    update() {
        this.lastPass = updateList(this.listHead, this.lastPass, this.items, this.template)
    }
}

function updateList<ET>(listHead:HTMLElement, lastPass:ET[], items:ObservableList<ET>, template:templateFunc<ET>) {
    let count = Math.min(lastPass.length, items.length)
    
    for (let i = 0; i < count; ++i) {
        if (lastPass[i] != items.at(i)) { // item change detected
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
function renderElements<ET>(listHead:HTMLElement, items:ObservableList<ET>, range:Range, template:templateFunc<ET>, pass:ET[]) {
    const insertLocation = {
        element: range.start < listHead.children.length ? listHead.children[range.start] : listHead,
        method: range.start < listHead.children.length ? "afterend" : "beforeend" as InsertPosition
    }

    for (let i = range.start; i < range.end; ++i) {
        const newElement = template(items.at(i))
        insertLocation.element.insertAdjacentElement(insertLocation.method, newElement)
        pass.push(items.at(i))
        insertLocation.element = newElement
        insertLocation.method = "afterend"
    }
    
}

function removeChildrenInRange(listHead:HTMLElement, range:Range) {
    const end = Math.min(listHead.children.length, range.end)
    for (let i = end - 1; i >= range.start; --i) {
        listHead.children[i].remove()
    }
}