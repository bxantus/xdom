import { calc, div, el } from "../src/xdom.ts"

const greeting = {
    greet: "Hello",
    user: "Word",
}

const main = el("div", { class:"main" }, 
    el("span", { text: calc(()=>`${greeting.greet} ${greeting.user}!`) }
    ),
)

window.onload = () => {
    document.body.append(main)
    // add a bunch of buttons for easier testing
    document.body.append(
        div({class:"controls greet"}, 
            el("button", { text:"Say 'Hi'",  onClick: ()=> greeting.greet = "Hi" }),
            el("button", { text:"Say 'Welcome'",  onClick: ()=> greeting.greet = "Welcome" }),
        ),
        div({class:"controls user"}, 
            el("button", { text:"To 'World'",  onClick: ()=> greeting.user = "Word" }),
            el("button", { text:"To 'John'",  onClick: ()=> greeting.user = "John" }),
        )
    )
}