// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function dispose(...objects) {
    for (const obj of objects){
        if (obj instanceof Array) {
            for (const o of obj)o.dispose();
            obj.splice(0);
        } else obj.dispose();
    }
}
const any = Symbol("AnyProperty");
class SubscriptionRepository {
    add(name, changeFunc) {
        let subsForName = this.subs.get(name) || [];
        if (subsForName.length == 0) {
            this.subs.set(name, subsForName);
        }
        let sub = {
            onChange: changeFunc
        };
        subsForName.push(sub);
        const unsubscribe = ()=>{
            const idx = subsForName.findIndex((val)=>val == sub
            );
            if (idx >= 0) subsForName.splice(idx);
        };
        return {
            unsubscribe,
            dispose: unsubscribe
        };
    }
    notifyFor(...names) {
        for (const name of names){
            const subsForName = this.subs.get(name);
            if (subsForName) for (let s of subsForName)s.onChange();
        }
        const anyPropSubs = this.subs.get(any);
        if (anyPropSubs) for (let s of anyPropSubs)s.onChange();
    }
    get changes() {
        return this.changesProxy;
    }
    subs = new Map();
    changesProxy = new Proxy(this, {
        get (target, p) {
            return {
                subscribe (subscriber) {
                    return target.add(p, subscriber);
                }
            };
        }
    });
}
function makeObservable(initialProps) {
    const oo = new ObservableObjectBase();
    for(const key in initialProps){
        oo[key] = initialProps[key];
    }
    return new Proxy(oo, observableTraps);
}
class ObservableObjectBase {
    __subs = new SubscriptionRepository;
    get $changes() {
        return this.__subs.changes;
    }
    constructor(){}
}
class ObservableTraps {
    get(target, p, receiver) {
        return target[p];
    }
    set(target, p, value, receiver) {
        const old = target[p];
        if (old != value) {
            target[p] = value;
            target.__subs.notifyFor(p, value);
        }
        return true;
    }
}
const observableTraps = new ObservableTraps;
class Binding {
    valueFunction;
    update;
    subs = [];
    constructor(vf, ...observables){
        this.valueFunction = vf;
        this.observe(...observables);
    }
    refresh() {
        const newVal = this.valueFunction();
        this.update?.(newVal);
    }
    compute() {
        return this.valueFunction();
    }
    onUpdate(updateFunction) {
        this.update = updateFunction;
        if (this.update) this.refresh();
    }
    bindTo(target, prop) {
        this.onUpdate((v)=>target[prop] = v
        );
    }
    observe(...observables) {
        const onChange = ()=>this.refresh()
        ;
        for (const obs of observables){
            if (!obs) continue;
            this.subs.push(obs.subscribe(onChange));
        }
    }
    dispose() {
        dispose(this.subs);
    }
}
function binding(valueFunction, ...observables) {
    return new Binding(valueFunction, ...observables);
}
function bind(target, prop, v, repo) {
    if (v === undefined) return;
    if (v instanceof Binding) {
        v.bindTo(target, prop);
        repo?.add(target, v);
        return v;
    } else target[prop] = v;
}
class BindingRepository {
    bindings = new Map();
    add(obj, binding1) {
        if (!binding1) return;
        const list = this.bindings.get(obj);
        if (!list) {
            this.bindings.set(obj, [
                binding1
            ]);
        } else list.push(binding1);
    }
    clearBindings(obj) {
        const list = this.bindings.get(obj);
        if (!list) return;
        for (const b of list)b.dispose();
        this.bindings.delete(obj);
    }
}
const bindingRepo = new BindingRepository();
function el(tagname, props, children) {
    const element = document.createElement(tagname);
    if (props?.id) element.id = props.id;
    if (props?.class) bind(element, "className", props.class, bindingRepo);
    if (props?.innerText) bind(element, "innerText", props.innerText, bindingRepo);
    if (props?.onClick) element.onclick = props.onClick;
    if (props?.src && element instanceof HTMLImageElement) bind(element, "src", props.src, bindingRepo);
    if (children) element.append(...children);
    return element;
}
function div(props, ...children) {
    return el("div", props, children);
}
const greeting = makeObservable({
    greet: "Hello",
    user: "Word"
});
const main = el("div", {
    class: "main"
}, [
    el("span", {
        innerText: binding(()=>`${greeting.greet} ${greeting.user}!`
        , greeting.$changes.greet, greeting.$changes.user)
    }), 
]);
window.onload = ()=>{
    document.body.append(main);
    document.body.append(div({
        class: "controls greet"
    }, el("button", {
        innerText: "Say 'Hi'",
        onClick: ()=>greeting.greet = "Hi"
    }), el("button", {
        innerText: "Say 'Welcome'",
        onClick: ()=>greeting.greet = "Welcome"
    })), div({
        class: "controls user"
    }, el("button", {
        innerText: "To 'World'",
        onClick: ()=>greeting.user = "Word"
    }), el("button", {
        innerText: "To 'John'",
        onClick: ()=>greeting.user = "John"
    })));
};
