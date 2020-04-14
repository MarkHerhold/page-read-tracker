// TODO check
// item.offsetParent === null

const WORDS_PER_MS = 250 / 60000;

class ElementMetric {
    elapsedTime: number = 0;
    numWords: number = 0;
    get score() {
        return Math.max(1, (WORDS_PER_MS * this.elapsedTime) / this.numWords);
    }
}

const trackMap: WeakMap<HTMLElement, ElementMetric> = new WeakMap();

let lastSnapshot = new Date().getTime();

function snapshot() {
    const pageTop = window.pageYOffset;
    const pageBottom = window.innerHeight + pageTop;
    const elements: HTMLElement[] = Array.apply(null, document.body.querySelectorAll("h1, h2, h3, h4, h5, h6, a, p, span, li"));
    const visibleElements = elements
        .filter((element) => {
            const yPos = element.getBoundingClientRect().top + window.scrollY;
            return yPos > pageTop && yPos < pageBottom;
        });

    // filter out child nodes contained by the parent
    const mapped = visibleElements.filter((element) => !elements.includes(element.parentElement))
        // transform to element metric
        .map((element) : [HTMLElement, ElementMetric] => {
            const elementText: string = element.textContent || '';
            const em = new ElementMetric();
            em.numWords = elementText.split(/\s+/).filter(str => str.length > 0).length;
            return [element, em];
        })
        .filter(pair => pair[1].numWords > 0);

    const totalVisibleWords = mapped.reduce((count, item) => count += item[1].numWords, 0);
    console.log('totalVisibleWords', totalVisibleWords)
    const msSinceLastSnapshot = new Date().getTime() - lastSnapshot;

    for (let [element, elementMetric] of mapped) {
        if (trackMap.has(element)) {
            const metric = trackMap.get(element);
            metric.elapsedTime += msSinceLastSnapshot;
            // console.log(`score: ${metric.score}\n${metric.numWords} words | ${metric.elapsedTime}ms`);

            element.style.backgroundColor = `hsl(145, ${metric.score * 100}%, 50%)`;
            for (let child of Array.apply(null, element.childNodes)) {
                if (child.style) {
                    child.style.backgroundColor = `hsl(145, ${metric.score * 100}%, 50%)`;
                }
            }
        } else {
            trackMap.set(element, elementMetric);
        }
    }
    lastSnapshot = new Date().getTime();
}

setInterval(() => {
    snapshot();
}, 100);
