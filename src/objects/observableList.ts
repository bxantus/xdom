import { SubscriptionRepository } from "../binding/subscriptions.ts";

/**
 * An observable list of items.
 * It has an interface similar to an Array. Whenever the contents of the list change, the "list" property will be marked as changed
 * and can be observed.
 */
export class ObservableList<T> {
    private items:T[] = []
    private subs = new SubscriptionRepository<"list">()
    static from<T>(items:Iterable<T>) {
        return new ObservableList([...items])
    }

    static of<T>(...items:T[]) {
        return new ObservableList(items)
    }

    constructor(initialItems?:T[]) {
        if (initialItems)
            this.items = initialItems
    }

    at(idx:number) {  return this.items[idx] }
    [Symbol.iterator]() { return this.items[Symbol.iterator]() }
    get length() { return this.items.length }

    toString() { return `list[${this.items.toString()}]` }

    push(...vals:T[]) {
        this.items.push(...vals)
        this.subs.notifyFor("list")
    }

    pop() {
        const res = this.items.pop()
        this.subs.notifyFor("list")
        return res
    }

    shift() {
        const res = this.items.shift()
        this.subs.notifyFor("list")
        return res
    }

    unshift(...vals:T[]) {
        this.items.unshift(...vals)
        this.subs.notifyFor("list")
    }

    splice(start: number, deleteCount?: number, ...items: T[]) {
        if (deleteCount == undefined)
            this.items.splice(start)
        else this.items.splice(start, deleteCount, ...items)
        this.subs.notifyFor("list")
    }

    slice(start?:number, end?:number) {
        return this.items.slice(start, end)
    }

    get $changes() { return this.subs.changes }
}