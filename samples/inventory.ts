import { list } from "../src/list.ts";
import { div, el, span } from "../src/xdom.ts"

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
        el("h2", {innerText: ()=> item.name}),
        el("p", { innerText: ()=>`Count: ${item.count}`}),
        el("p", {},
            span({innerText:"Owner: "}),
            span({class:"name", innerText:()=>`${item.owner.name} `}),
            span({class:"prename", innerText:()=>item.owner.prename}),
        )
    )
}

const owners = {
    John: { name:"John", prename:"Doe" },
    Mary: { name:"Mary", prename:"Sullivan" },
    Casey: { name:"Casey", prename:"Jordan" },
}

const inventory:Item[] = [
    { name:"Snickers", count:10, owner:owners.Casey },
    { name:"Bounty", count:3, owner:owners.John }
] 

window.onload = () => {
    document.body.append(
        div({innerText:"Main inventory"},
            list(div({}), inventory, inventoryItem)
        )
    )
}