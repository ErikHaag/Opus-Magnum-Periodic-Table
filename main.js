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

function distributeSVGs(force = false) {
    let symbolsElement = document.getElementById("symbols");
    let chart = document.getElementById("chart");
    let useElem;
    while (useElem = chart.querySelector("use:not(.handled)")) {
        useElem.classList.add("handled")
        let T = useElem.getAttribute("transform") ?? "";
        const symbol = symbolsElement.getElementById(useElem.getAttribute("href").substring(1));
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        if (symbol) {
            if (!force && (useElem.classList.contains("noClone") || symbol.classList.contains("noClone"))) {
                continue;
            }
            if (symbol.classList.contains("nudge-up")) {
                T = "translate(0, -3.75) " + T;
            } else if (symbol.classList.contains("nudge-down")) {
                T = "translate(0, 3.75) " + T;
            }
            let strokeData = useElem.getAttribute("data-stroke-color");
            let isSymbol = !(symbol.classList.contains("nonsymbol") || useElem.classList.contains("nonsymbol"));
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
                if (strokeData) {
                    if (cClone.tagName == "use") {
                        cClone.setAttribute("data-stroke-color", strokeData);
                    } else {
                        cClone.classList.remove("symbol");
                        cClone.setAttribute("stroke", strokeData);
                    }
                }
                group.insertAdjacentElement("beforeend", cClone);
            }
            for (const c of useElem.classList) {
                group.classList.add(c);
            }
        }
        useElem.insertAdjacentElement("afterend", group);
        useElem.remove();
    }
    clearHandledFlag()
}

function clearHandledFlag() {
    for (let elem of Array.from(document.getElementsByClassName("handled"))) {
        elem.classList.remove("handled");
        if (!elem.classList.length) {
            elem.removeAttribute("class");
        }
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

// modify DOM for exporting
function denormalize() {
    distributeSVGs(true);

    function normalizeColor(color) {
        if (color == "none" || color.startsWith("url(")) {
            return color;
        }
        let red = -1;
        let green = -1;
        let blue = -1;
        if (color.startsWith("rgb(")) {
            [red, green, blue] = color.substring(4, color.length - 1).split(",").map((e) => Number.parseFloat(e.trim()));
        }

        if (color.startsWith("color(srgb")) {
            [red, green, blue] = color.substring(11, color.length - 1).split(" ").map(e => 255 * Number.parseFloat(e.trim()));
        }

        if (red == -1 || green == -1 || blue == -1) {
            throw new Error("Unknown color \"" + color + "\"");
        }

        function clamp(i) {
            if (i < 0n) {
                return 0n;
            } else if (i > 255n) {
                return 255n;
            }
            return i;
        }

        // hex codes are well known and sufficient in most applications.
        red = clamp(BigInt(Math.round(red)));
        green = clamp(BigInt(Math.round(green)));
        blue = clamp(BigInt(Math.round(blue)));
        /*
        if (red % 17n == 0n && green % 17n == 0n && blue % 17n == 0n) {
            // compact form!
            return "#" + red.toString(16)[0] + green.toString(16)[0] + blue.toString(16)[0];
        }
        */       
        // force three hex digits
        red += 0x100n;
        green += 0x100n;
        blue += 0x100n;
        // then chop off the first one
        return "#" + red.toString(16).substring(1) + green.toString(16).substring(1) + blue.toString(16).substring(1);
    }

    let elemStack = Array.from(document.getElementById("chart").children);
    while (elemStack.length) {
        let elem = elemStack.pop();
        for (let c of elem.children) {
            elemStack.push(c);
        }
        let flags = { circleR: false, fill: false, stop: false, stroke: false, text: false }
        switch (elem.tagName) {
            case "circle":
                flags.circleR = true;
                flags.fill = true;
                flags.stroke = true;
                break;
            case "ellipse":
            case "path":
            case "rect":
                flags.fill = true;
                flags.stroke = true;
                break;
            case "line":
                flags.stroke = true;
                break;
            case "stop":
                flags.stop = true;
                break;
            case "text":
                flags.fill = true;
                flags.text = true;
                break;
            default:
                break;
        }

        let computedStyle = window.getComputedStyle(elem);
        if (flags.circleR) {
            elem.setAttribute("r", computedStyle.r);
        }

        if (flags.fill) {
            let f = normalizeColor(computedStyle.getPropertyValue("fill"));
            if (f == "#000") {
                elem.removeAttribute("fill");
            } else {
                elem.setAttribute("fill", f);
            }
        }

        if (flags.stop) {
            elem.setAttribute("stop-color", normalizeColor(computedStyle.stopColor));
        }

        if (flags.stroke) {
            let s = normalizeColor(computedStyle.getPropertyValue("stroke"));
            if (s == "none") {
                elem.removeAttribute("stroke");
            } else {
                elem.setAttribute("stroke", s);
            }

            let w = computedStyle.strokeWidth;
            if (w == "1px") {
                elem.removeAttribute("stroke-width");
            } else {
                elem.setAttribute("stroke-width", w);
            }
        }

        if (flags.text) {
            elem.style.fontFamily = computedStyle.fontFamily.split(",")[0].trim();
            elem.style.fontStyle = computedStyle.fontStyle;
            elem.style.fontSize = computedStyle.fontSize;
        }
    }

    // remove classes and data
    elemStack = Array.from(document.getElementById("chart").children);
    while (elemStack.length) {
        let elem = elemStack.pop();
        for (let c of elem.children) {
            elemStack.push(c);
        }
        elem.removeAttribute("class");
    }
}

window.addEventListener("load", async () => {
    await loadSVGs();
    initializeAlignment();
    alignElements(true);
    dragElements();
    adjustLabelBoxes();
});