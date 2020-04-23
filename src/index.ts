declare global {
    interface Window {
        readTracker: ReadTracker;
    }
}

/** Average reading rate. Grossly misused in this application, but it's a start! */
const WORDS_PER_MS = 250 / 60000;

class ElementMetric {
    elapsedTime: number = 0;
    numWords: number = 0;
    get score() {
        return Math.min(1, (WORDS_PER_MS * this.elapsedTime) / this.numWords);
    }
}

class ReadTracker {
    private trackMap: WeakMap<HTMLElement, ElementMetric> = new WeakMap();
    private lastSnapshot = new Date().getTime();
    private pollIntervalId: number;

    constructor() {
        this.poll();
    }

    /**
     * Triggers a snapshot of the page every 100ms if the page is visible
     */
    poll(): void {
        const startPolling = () => {
            this.pollIntervalId = setInterval(() => {
                this.snapshot();
            }, 100);
        };

        // start polling upon invocation
        startPolling();

        document.addEventListener("visibilitychange", () => {
            clearInterval(this.pollIntervalId); // to be safe, clear no matter what
            if (document.visibilityState === 'visible') {
                startPolling();
            }
        });
    }

    /**
     * Take a snapshot of the page's elements. Updates the internal list of DOM elements and associated scores.
     */
    snapshot(): void {
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
        const msSinceLastSnapshot = new Date().getTime() - this.lastSnapshot;

        for (let [element, elementMetric] of mapped) {
            if (this.trackMap.has(element)) {
                const metric = this.trackMap.get(element);
                metric.elapsedTime += msSinceLastSnapshot;
                // console.log(`score: ${metric.score}\n${metric.numWords} words | ${metric.elapsedTime}ms`);

                colorElement(element, metric);
            } else {
                this.trackMap.set(element, elementMetric);
            }
        }
        this.lastSnapshot = new Date().getTime();
    }
}

/**
 * Colors an element and its children based on its score. For debugging/development.
 * @param element
 * @param metric
 */
function colorElement(element: HTMLElement, metric: ElementMetric) {
    window.requestAnimationFrame(() => {
        element.style.backgroundColor = `hsl(145, ${metric.score * 100}%, 50%)`;
        for (let child of Array.apply(null, element.childNodes)) {
            if (child.style) {
                child.style.backgroundColor = `hsl(145, ${metric.score * 100}%, 50%)`;
            }
        }
    });
}

if (!window.readTracker) {
    window.readTracker = new ReadTracker();
}

export {
    ReadTracker
};
