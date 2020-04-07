// TODO check
// item.offsetParent === null

import { xPath } from './xpath';

const WORDS_PER_MS = 250 / 60000;

class ElementMetric {
    element: HTMLElement;
    elapsedTime: number;
    numWords: number;
    score: number;
}

const trackMap: Map<string, ElementMetric> = new Map();

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
        .map((element) : ElementMetric => {
            const elementText: string = element.textContent || '';
            return {
                element,
                elapsedTime: 0,
                numWords: elementText.split(/\s+/).filter(str => str.length > 0).length,
                score: 0
            };
        })
        .filter(item => item.numWords > 0);

    const totalVisibleWords = visibleElements.reduce((p, c) => {
        return p + c.numWords;
    }, 0);

    // const msToReadAllVisibleWords = totalVisibleWords / WORDS_PER_MS;
    // console.log('WORDS_PER_MS', WORDS_PER_MS)
    // console.log('totalVisibleWords', totalVisibleWords)
    // console.log('msToReadAllVisibleWords', msToReadAllVisibleWords)

    const msSinceLastSnapshot = new Date().getTime() - lastSnapshot;

    for (let elementMetric of visibleElements) {
        const elementXPath = xPath(elementMetric.element, false);
        if (trackMap.has(elementXPath)) {
            const metric = trackMap.get(elementXPath);
            metric.elapsedTime += msSinceLastSnapshot;
            metric.score = (WORDS_PER_MS * metric.elapsedTime) / metric.numWords;
            console.log(`
                score: ${metric.score}
                elapsed: ${metric.elapsedTime}
                numWords: ${metric.numWords}
            `);

            metric.element.style.backgroundColor = `hsl(145, ${metric.score}%, 50%)`;
        } else {
            trackMap.set(elementXPath, elementMetric);
        }
    }
    lastSnapshot = new Date().getTime();
}

setInterval(() => {
    snapshot();
}, 100);
