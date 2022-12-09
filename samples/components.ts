import { div, span } from "../src/xdom.ts";
import { appBar, controller } from "./sampleComponents.ts";

const mainController = controller({
    root: div({class:"mainContent"}),
    initialContent: "Hello"
}) 

window.onload = () => {
    const app =div({id:"app"},
        mainController,
        appBar({
            apps: [
                {label: "Home", action:()=> mainController.set(homeApp) },
                {label: "Music", action:()=> mainController.set(musicApp)},
                {label: "News", action:()=>mainController.set(newsApp)  }
            ]
            // todo: we should be able to select the default app, without it the componenet can't initialize correctly
        })
    )
    
    document.body.append(app)
}

let musicInst = 0
const musicApp = () => div({},
    // NOTE: only added to illustrate that musicApp will be rebuilt each time it will be selected
    `My Music App! (build${++musicInst})`
)

const homeApp = span({ text: "Home"})
const newsApp = span({text: "News"})
