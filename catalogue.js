const svgNamespace = "http://www.w3.org/2000/svg";
let symbolsElement;
let collage;
let finishFunction = () => {};

document.addEventListener("DOMContentLoaded", () => {
    symbolsElement = document.getElementById("atomSymbols");
    collage = document.getElementById("collage")
    let request = fetch("https://cdn.jsdelivr.net/gh/ErikHaag/OpusMagnumStoichiometry/symbols.svg");
    // let request = fetch("symbols.svg");
    request.then((response) => response.text())
    .then((data) => {
        let info = /<symbol[\s\S]*<\/symbol>/.exec(data);
        symbolsElement.innerHTML += info[0];
        distributeSVGs();
        symbolsElement.remove();
        finishFunction();
    });
});

function distributeSVGs() {
    let useElem;
    while (useElem = symbolsElement.querySelector("use")) {
        const T = useElem.getAttribute("transform") ?? "";
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
    let atomNames = Array.from(symbolsElement.children).map((e) => e.id).filter((i) => i.endsWith("_symbol")).map((i) => i.substring(0, i.length - 7)).sort();

    let styles = Array.from(window.getComputedStyle(document.body)).filter((v) => v.startsWith("--")).sort();
    
    let x = 0n;
    let y = 0n;
    let atomPerRow = 10n;
    collage.style.width = atomNames.length < 10 ? (60 * atomNames.length) + "px" : (70n * atomPerRow).toString() + "px";
    collage.style.height = (70n * ((BigInt(atomNames.length) + atomPerRow - 1n) / atomPerRow))

    for (let name of atomNames) {
        let c = document.getElementById(name + "_symbol");

        let styleName = name.replace("_", "-");

        let backgroundColor = "--" + styleName + "-color";
        if (!styles.includes(backgroundColor)) {
            backgroundColor = "--" + styleName + "-base-color";
        }

        if (styles.includes(backgroundColor)) {
            backgroundColor = "var(" + backgroundColor + ")";
        } else {
            backgroundColor = "#F0F";
            console.log(name + " is missing its background color");
        }

        let strokeColor = "--" + styleName + "-stroke-color";
        if (styles.includes(strokeColor)) {
            strokeColor = "var(" + strokeColor + ")";
        } else {
            strokeColor = "#fefefe";
        }

        let group = document.createElementNS(svgNamespace, "g");
        collage.appendChild(group);
        group.setAttribute("transform", "translate(" + (70n * x).toString() + ", " + (70n * y).toString() + ")");
        x += 1n;
        if (x >= atomPerRow) {
            x = 0n;
            y += 1n;
        }

        let atomGroup = document.createElementNS(svgNamespace, "g");
        group.appendChild(atomGroup);
        atomGroup.id = name + "_atom";

        let circle = document.createElementNS(svgNamespace, "circle");
        atomGroup.appendChild(circle);
        circle.setAttribute("cx", 30);
        circle.setAttribute("cy", 30);
        circle.setAttribute("r", 30);
        circle.setAttribute("fill", backgroundColor);

        switch (name) {
            case "aether":
                {
                    let a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "30");
                    a.setAttribute("cy", "28");
                    a.setAttribute("r", "10");
                    a.setAttribute("fill", "var(--aether-red-color)");
                    
                    a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "30");
                    a.setAttribute("cy", "38");
                    a.setAttribute("r", "15");
                    a.setAttribute("fill", "var(--aether-cyan-color)");
                    
                    a = document.createElementNS(svgNamespace, "path");
                    atomGroup.appendChild(a);
                    a.setAttribute("d", "M 20,40 c 10,15,5,15,0,10 s -15,-10,-10,-25 s 15,-4,15,0 s -10,7.5,-5,15");
                    a.setAttribute("fill", "var(--aether-magenta-color)");
                }
                break;
            case "quintessence":
                {
                    let a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "24");
                    a.setAttribute("cy", "42");
                    a.setAttribute("r", "12");
                    a.setAttribute("fill", "var(--fire-color)");
                    
                    a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "42");
                    a.setAttribute("cy", "42");
                    a.setAttribute("r", "9");
                    a.setAttribute("fill", "var(--water-color)");
                    
                    a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "30");
                    a.setAttribute("cy", "33");
                    a.setAttribute("r", "12");
                    a.setAttribute("fill", "var(--earth-color)");

                    a = document.createElementNS(svgNamespace, "circle");
                    atomGroup.appendChild(a);
                    a.setAttribute("cx", "33");
                    a.setAttribute("cy", "42");
                    a.setAttribute("r", "9");
                    a.setAttribute("fill", "var(--air-color)");
                }
                break;
            default:
                break;
        }


        let symbolG = document.createElementNS(svgNamespace, "g");
        atomGroup.appendChild(symbolG);
        let T = "";
        if (c.classList.contains("nudge-up")) {
            T = "translate(0, -3.75) ";
        } else if (c.classList.contains("nudge-down")) {
            T = "translate(0, 3.75) ";
        }
        symbolG.setAttribute("transform", T + "translate(3, 3) scale(0.9)");

        for (let p of c.children) {
            let pClone = p.cloneNode();
            symbolG.appendChild(pClone);

            pClone.setAttribute("stroke", strokeColor);
            if (p.classList.contains("noFill")) {
                pClone.setAttribute("fill", "none");
            } else if (p.classList.contains("strokeFill")) {
                pClone.setAttribute("fill", strokeColor);
            }
        }

    }
}