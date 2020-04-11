// TODO check
// item.offsetParent === null

const WORDS_PER_MS = 250 / 60000;

class ElementMetric {
    elapsedTime: number;
    numWords: number;
    score: number;
}

const trackMap: WeakMap<HTMLElement, ElementMetric> = new WeakMap();

let lastSnapshot = new Date().getTime();

function snapshot() {
    const pageTop = window.pageYOffset;
    const pageBottom = window.innerHeight + pageTop;
    const elements: HTMLElement[] = Array.apply(null, document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, span, div"));
    let visibleElements = elements
        .filter((element) => {
            const yPos = element.getBoundingClientRect().top + window.scrollY;
            return yPos > pageTop && yPos < pageBottom;
        })
        .filter((element) => element.childElementCount === 0)
        // transform to element metric
        .map((element) : [HTMLElement, ElementMetric] => {
            const elementText: string = element.textContent || '';
            return [element, {
                elapsedTime: 0,
                numWords: elementText.split(/\s+/).filter(str => str.length > 0).length,
                score: 0
            }];
        })
        .filter(pair => pair[1].numWords > 0);

    const msSinceLastSnapshot = new Date().getTime() - lastSnapshot;

    for (let [element, elementMetric] of visibleElements) {
        if (trackMap.has(element)) {
            const metric = trackMap.get(element);
            metric.elapsedTime += msSinceLastSnapshot;
            metric.score = (WORDS_PER_MS * metric.elapsedTime) / metric.numWords;
            console.log(`score: ${metric.score}\n${metric.numWords} words | ${metric.elapsedTime}ms`);

            element.style.backgroundColor = `hsl(145, ${metric.score}%, 50%)`;
        } else {
            trackMap.set(element, elementMetric);
        }
    }
    lastSnapshot = new Date().getTime();
}

setInterval(() => {
    snapshot();
}, 100);
