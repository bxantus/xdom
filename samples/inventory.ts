import { listItems } from "../src/list.ts";
import { calc, div, el, span } from "../src/xdom.ts"
import { stats } from "../src/domChanges.ts"
import { ObservableList } from "../src/objects/observableList.ts";

interface Item {
    name:string
    count:number
    owner:{
        name:string
        prename:string
    }
    important?:boolean
}

function inventoryItem(item:Item) {
    return div({},
        el("h2", { text: calc(()=> item.name) }),
        el("p",  { text: calc(()=>`Count: ${item.count}`) }),
        el("p", {},
            span({text:"Owner: "}),
            span({class:"name", text: calc(()=>`${item.owner.name} `)}),
            span({class:"prename", text: calc(()=>item.owner.prename)}),
        )
    )
}

const owners = {
    John: { name:"John", prename:"Doe" },
    Mary: { name:"Mary", prename:"Sullivan" },
    Casey: { name:"Casey", prename:"Jordan" },
}

const inventory = ObservableList.of(
    { name:"Snickers", count:10, owner:owners.Casey },
    { name:"Bounty", count:3, owner:owners.John }
)

window.onload = () => {
    document.body.append(
        div({},
            el("p", {text:"Stats: ", class:"stats"},
                span({text:calc(()=>`[LightBound objs: ${stats.numLightBoundObjects}], `)}),
                span({text:calc(()=>`[Recurring updates: ${stats.numRecurringUpdates}]`)}),
                span({text:calc(()=>`[Fps: ${stats.fps}]`)}),
            )
        ),

        div({text:"Main inventory"},
            listItems(div({}), inventory, inventoryItem)
        )
    )
    addNewItem("alma")
}

function addNewItem(name:string, count?:number) {
    inventory.push({
        name,
        count: count ?? Math.floor( Math.random() * 50),
        owner: owners.John
    })
}