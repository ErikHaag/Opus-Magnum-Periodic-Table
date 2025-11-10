async function loadSVGs() {
    // semi-inelegant hack
    let symbolsElement = document.getElementById("symbols");
    let response = await fetch("https://cdn.jsdelivr.net/gh/ErikHaag/OpusMagnumStoichiometry/symbols.svg");
    // let response = await fetch("symbols.svg");
    let data = await response.text();
    let info = /<symbol[\s\S]*<\/symbol>/.exec(data);
    symbolsElement.innerHTML += info[0];
    let useElem;
    while (useElem = symbolsElement.querySelector("use")) {
        const T = useElem.getAttribute("transform");
        const symbolChildren = symbolsElement.getElementById(useElem.getAttribute("href").substring(1)).children;
        if (T) {
            for (const c of symbolChildren) {
                let cClone = c.cloneNode();
                cClone.setAttribute("transform", T + " " + (cClone.getAttribute("transform") ?? ""));
                useElem.insertAdjacentElement("beforebegin", cClone);
            }
        } else {
            for (const c of symbolChildren) {
                useElem.insertAdjacentElement("beforebegin", c.cloneNode());
            }
        }
        useElem.remove();
    }
    distributeSVGs();
}

function distributeSVGs() {
    let symbolsElement = document.getElementById("symbols");
    let chart = document.getElementById("chart");
    let useElem;
    while (useElem = chart.querySelector("use")) {
        const T = useElem.getAttribute("transform") ?? "";
        const symbol = symbolsElement.getElementById(useElem.getAttribute("href").substring(1));
        let isSymbol = !(symbol.classList.contains("nonsymbol") || useElem.classList.contains("nonsymbol"));
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        if (isSymbol) {
            group.setAttribute("transform", (T + " translate(3, 3) scale(0.9)").trim());
        } else {
            group.setAttribute("transform", T);
        }
        for (const c of symbol.children) {
            let cClone = c.cloneNode();
            if (isSymbol) {
                cClone.classList.add("symbol");
            }
            group.insertAdjacentElement("beforeend", cClone);
        }
        for (const c of useElem.classList) {
            group.classList.add(c);
        }
        useElem.insertAdjacentElement("afterend", group);
        useElem.remove();
    }
}

function initializeAlignment() {
    for (const elem of document.querySelectorAll("text")) {
        let T = elem.getAttribute("transform") ?? "";
        T = "translate(" + (elem.getAttribute("x") ?? "0") + ", " + (elem.getAttribute("y") ?? "0") + ") " + T.trim();
        elem.setAttribute("transform", T);
        elem.removeAttribute("x");
        elem.removeAttribute("y");
    }
}

function alignElements(first = false) {

    function adjust(e, x, y) {
        let transform = e.getAttribute("transform") ?? "";
        let i = transform.indexOf(")");
        if (i != -1 && !first) {
            transform = transform.substring(i + 1);
        }
        transform = "translate(" + x.toFixed(2) + ", " + y.toFixed(2) + ") " + transform.trim();
        e.setAttribute("transform", transform);
    }

    function centerElement(e) {
        let offsetX = 0;
        let offsetY = 0;
        if (e.hasAttribute("data-box-width")) {
            offsetX = (Number.parseFloat(e.getAttribute("data-box-width")) - e.getBBox().width) / 2
        }
        if (e.hasAttribute("data-box-height")) {
            offsetY = (Number.parseFloat(e.getAttribute("data-box-height")) - e.getBBox().height) / 2
            if (e.tagName == "text") {
                offsetY -= e.getBBox().y
            }
        }
        adjust(e, offsetX, offsetY);
    }

    function pushH(e) {
        if (e.hasAttribute("data-desired-left")) {
            let offset = e.getAttribute("data-desired-left") - e.getBBox().x;
            adjust(e, offset, 0);
        } else if (e.hasAttribute("data-desired-right")) {
            let b = e.getBBox()
            let offset = e.getAttribute("data-desired-right") - b.x - b.width;
            adjust(e, offset, 0);
        }
    }

    function alignRecurse(e) {
        for (const c of e.children) {
            alignRecurse(c);
        }
        let classes = e.classList;
        if (classes.contains("center")) {
            centerElement(e);
        } else if (classes.contains("pushH")) {
            pushH(e);
        }
    }
    alignRecurse(document.getElementsByTagName("body")[0]);
}

function adjustLabelBoxes(padding = 2) {
    for (const l of document.querySelectorAll("rect.label")) {
        let parent = l.parentElement;
        let minX, maxX, minY, maxY;
        let foundSelf = false;
        let pt = parent.getCTM();
        for (const c of parent.children) {
            if (c === l) {
                foundSelf = true;
                continue;
            }
            if (!foundSelf) {
                continue;
            }
            if (c.nodeName != "text") {
                break;
            }
            let b = c.getBBox();
            let lt = c.getCTM();
            let left = b.x + lt.e - pt.e;
            let right = left + b.width;
            let top = b.y + lt.f - pt.f;
            let bottom = top + b.height;
            if (minX == null) {
                minX = left;
                maxX = right;
                minY = top;
                maxY = bottom;
            } else {
                minX = Math.min(minX, left);
                maxX = Math.max(maxX, right);
                minY = Math.min(minY, top);
                maxY = Math.max(maxY, bottom);
            }
        }
        if (l.classList.contains("element-label")) {
            let w = maxX - minX;
            w = 40 - w / 2;
            minX -= w;
            maxX += w;
            minY -= padding;
            maxY += padding;
        } else if (l.classList.contains("description")) {
            minX -= padding;
            maxX += padding;
            minY -= padding;
            maxY += padding;
        }

        l.setAttribute("x", minX.toFixed(2));
        l.setAttribute("y", minY.toFixed(2));
        l.setAttribute("width", (maxX - minX).toFixed(2));
        l.setAttribute("height", (maxY - minY).toFixed(2));
    }
}

function dragElements() {
    for (const c of document.querySelectorAll(".copy-transform")) {
        id = c.getAttribute("data-copy-transform-id");
        c.setAttribute("transform", document.getElementById(id).getAttribute("transform"));
    }
}

window.addEventListener("load", async () => {
    await loadSVGs();
    initializeAlignment();
    alignElements(true);
    dragElements();
    adjustLabelBoxes();
});