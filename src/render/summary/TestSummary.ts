import { Constants } from "../Constants";

/**
 * Create test summary
 * @export
 * @class TestSummary
 */
export class TestSummary {
    /**
     * Ancestor title join character
     * @static
     * @memberof TestSummary
     */
    public static readonly JOIN_CHAR = ".";

    /**
     * Build table info for specific tests
     * @static
     * @returns {HTMLElement[]} - populated html elements
     * @memberof TestSummary
     */
    public static create(results: jest.AggregatedResult): HTMLElement[] {
        const elements: HTMLElement[] = [];

        const div = document.createElement("div") as HTMLDivElement;
        div.classList.add("my-3", "p-3", "bg-white", "rounded", "box-shadow", "summary");

        const h5 = document.createElement("h5") as HTMLHeadingElement;
        h5.classList.add("border-bottom", "pb-2", "display-5", "summary-title");
        h5.textContent = "Summary";

        div.appendChild(h5);
        div.id = "test-summary";
        elements.push(div);

        results.testResults.forEach((testResult, pathIndex) => {

            // NOTE(Kelosky): jest.AggregateResult has a testResults array
            // which contains a jest.TestResults array.  jest.TestResults array
            // is of type AssertionResults array.  however, it looks like they
            // somehow allow for the the field name to be assertionResults instead
            // of the documented interface testResults.  So, we'll cast to any, and attempt
            // access assertionResults if testsResults are missing
            if (testResult.testResults == null) {
                // tslint:disable-next-line:no-console
                console.error("Unexpected testResults field missing");
                if ((testResult as any).assertionResults != null) {
                    // tslint:disable-next-line:no-console
                    console.warn("Attempting to use assertionResults: results are unpredictable");
                    testResult.testResults = (testResult as any).assertionResults;
                }
            }

            const divMap: Map<string, HTMLElement> = new Map<string, HTMLElement>();
            const testCountMap: Map<string, any> = new Map<string, any>();
            const testCountArray: string[] = [];

            const testTitleDiv = document.createElement("div") as HTMLDivElement;
            testTitleDiv.classList.add("summary-test-suite");

            const testFileLink = document.createElement("a") as HTMLAnchorElement;
            const isFail = testResult.numFailingTests > 0;

            const testStatus = document.createElement("strong") as HTMLSpanElement;

            testStatus.classList.add("summary-test-label");
            if (!isFail) {
                testStatus.classList.add("pass");
                testStatus.textContent = "PASS";
            } else {
                testStatus.classList.add("fail");
                testStatus.textContent = "FAIL";
            }

            const testFileLine = document.createElement("strong") as HTMLSpanElement;
            testFileLine.classList.add("summary-test-label", "path");
            testFileLine.textContent = testResult.testFilePath;

            testFileLink.href = "#" + testResult.testFilePath;
            testFileLink.appendChild(testStatus);
            testFileLink.appendChild(testFileLine);

            testTitleDiv.appendChild(testFileLink);
            div.appendChild(testTitleDiv);

            testResult.testResults.forEach((test, testIndex) => {
                if (test.ancestorTitles.length > 0) {
                    test.ancestorTitles.forEach((title, index) => {

                        const titlesCopy = test.ancestorTitles.slice();
                        titlesCopy.splice(index + 1);
                        const key = titlesCopy.join(TestSummary.JOIN_CHAR);
                        if (!divMap.has(key)) {
                            const nestDiv = document.createElement("div") as HTMLDivElement;
                            nestDiv.classList.add("summary-ancestor-box");
                            nestDiv.id = key;

                            divMap.set(key, nestDiv);

                            if (index === 0) {
                                div.appendChild(nestDiv);
                            } else {
                                titlesCopy.pop();
                                const parentKey = titlesCopy.join(TestSummary.JOIN_CHAR);
                                divMap.get(parentKey).appendChild(nestDiv);

                                const href = "#" + key + TestSummary.JOIN_CHAR
                                    + pathIndex + TestSummary.JOIN_CHAR + testIndex
                                    + TestSummary.JOIN_CHAR + index;
                                testCountMap.set(key, {
                                    locale: test.ancestorTitles[0],
                                    title,
                                    href,
                                    passingTests: 0,
                                    pendingTests: 0,
                                    failingTests: 0
                                });
                                testCountArray.push(key);

                            }
                        }

                        if (index !== 0) {
                            const testCount = testCountMap.get(key);
                            if (test.status === Constants.TEST_STATUS_PASS) {
                                testCount.passingTests = testCount.passingTests + 1;
                            }

                            if (test.status === Constants.TEST_STATUS_PEND) {
                                testCount.pendingTests = testCount.pendingTests + 1;
                            }

                            if (test.status === Constants.TEST_STATUS_FAIL) {
                                testCount.failingTests = testCount.failingTests + 1;
                            }
                            testCountMap.set(key, testCount);
                        }
                    });
                }
            });

            const locales =  [...new Set(testCountArray.map((key) => testCountMap.get(key).locale))];

            testCountArray.forEach((key) => {
                const testCount = testCountMap.get(key);
                const testCountSpan = document.createElement("strong") as HTMLSpanElement;
                testCountSpan.classList.add("summary-test-count");

                const testTotal = testCount.passingTests + testCount.pendingTests + testCount.failingTests;
                testCount.testTotal = testTotal;
                const testCountText = "[" + testCount.passingTests + "/" + testTotal + "]";
                testCountSpan.textContent = testCountText;

                const containerDiv = divMap.get(key);
                const ancestorLink = document.createElement("a") as HTMLAnchorElement;
                ancestorLink.textContent = locales.length > 1 ? `(${testCount.locale}) ${testCount.title}`
                    : testCount.title;
                ancestorLink.href = testCount.href;
                ancestorLink.classList.add("summary-test-label", "path");

                containerDiv.appendChild(TestSummary.getSimbolSpanFromStatus(testCount));
                containerDiv.appendChild(ancestorLink);
                containerDiv.appendChild(testCountSpan);
            });

        });

        return elements;
    }

    /**
     * Generates a span with a symbol and appropiate color from the test status
     * @static
     * @param {status} string - the test status
     * @returns {HTMLSpanElement} - populated element
     * @memberof TestSummary
     */
    private static getSimbolSpanFromStatus({testTotal, passingTests, pendingTests, failingTests}) {
        const span = document.createElement("span") as HTMLSpanElement;
        span.classList.add("summary-test-label", "test", "smallLabel");

        if (failingTests > 0) {
            span.textContent = "X";
            span.classList.add("fail");
        } else if (pendingTests === testTotal) {
            span.textContent = "O";
            span.classList.add("pending");
        } else if (passingTests + pendingTests === testTotal) {
            span.textContent = "✓";
            span.classList.add("pass");
        }

        return span;
    }
}
