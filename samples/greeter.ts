import { div, el } from "../src/xdom.ts"

const greeting = {
    greet: "Hello",
    user: "Word",
}

const main = el("div", { class:"main" }, 
    el("span", { innerText: ()=>`${greeting.greet} ${greeting.user}!` }
    ),
)

window.onload = () => {
    document.body.append(main)
    // add a bunch of buttons for easier testing
    document.body.append(
        div({class:"controls greet"}, 
            el("button", { innerText:"Say 'Hi'",  onClick: ()=> greeting.greet = "Hi" }),
            el("button", { innerText:"Say 'Welcome'",  onClick: ()=> greeting.greet = "Welcome" }),
        ),
        div({class:"controls user"}, 
            el("button", { innerText:"To 'World'",  onClick: ()=> greeting.user = "Word" }),
            el("button", { innerText:"To 'John'",  onClick: ()=> greeting.user = "John" }),
        )
    )
}