// ==UserScript==
// @name         DongleSize2Metric
// @namespace    https://github.com/yossi99/DongleSize2Metric
// @version      2024-01-05
// @description  Convert the toy size chart information from imperial to metric system from some famous adult toy makers
// @author       Yossi99
// @match        https://twintailcreations.com/products/*
// @match        https://bad-dragon.com/products/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bad-dragon.com
// @license      MIT
// ==/UserScript==


const SupportedDomains = Object.freeze({
    TwinTail: 'twintailcreations.com',
    BadDragon: 'bad-dragon.com'
});

(function() {
    const domain = window.location.host
    const supDomains = Object.values(SupportedDomains);
    if (!supDomains.find(i => i === domain)) {
        console.log('Domain not supported');
        return;
    }
    const domainMap = {
        [SupportedDomains.TwinTail]: PatchTwinTailSizeTable,
        [SupportedDomains.BadDragon]: PatchBadDragonSizeTable
    }
    const observer = new MutationObserver((event) => {
        const result = domainMap[domain]();
        if (result) {
            observer.disconnect();
        }
    });
    observer.observe(document.querySelector('body'), {childList: true, subtree: true});
})();

function inches2CmFormated(string) { return `${(+string * 2.54).toFixed(2)} cm`;}

function PatchBadDragonSizeTable() {
    const toySizeTable = document.querySelector('.modal.sizing-chart__modal')?.querySelector('table');
    if (!toySizeTable) {
        console.error("Toy size table not found");
        return false;
    }
    const tableRows = toySizeTable.querySelectorAll('tr')
    for (let row of tableRows) {
        const header = row.querySelector('th');
        (header ? patchHeader(header) : console.warn ('Header not found'));
        [...row.querySelectorAll('td')]
            .filter(i => !Number.isNaN(+i.textContent))
            ?.forEach(i => (i.textContent = inches2CmFormated(i.textContent)));
    }
    return true;
    function patchHeader(header) {
        const headerExp = /(?:\w+| )+ \([\w]+\)$/s;
        if (!headerExp.test(header.textContent)) {
            return;
        }
        header.textContent = header.textContent.replace(/\([\w]+\)$/s, '(cm)');
    }
}

function PatchTwinTailSizeTable() {
    const chartBtn = document.querySelector('.ProductForm__Label > button')
    if (!chartBtn) {
        console.error('chart button not found');
        return;
    }
    const chartControlName = chartBtn.getAttribute('aria-controls');
    if (!chartControlName) {
        console.error('Chart control name not found');
        return false;
    }
    const toySizeTable = document.querySelector(`[id=${chartControlName}]`)?.querySelector('table');
    if (!toySizeTable) {
        console.error('Toy size table not found!');
        return false;
    }
    // Get rows and skip header (toy name)
    const tableRows = [...(document.querySelectorAll('tr') ?? [])].slice(1);
    for (let row of tableRows) {
        // Skip category header
        const rowData = [...(row.querySelectorAll('td') ?? [])].slice(1);
        rowData.filter(i => /[\d]+"/s.test(i.textContent))
            .forEach(i => (i.textContent = inches2CmFormated(i.textContent.slice(0, -1))))
    }
    return true;
}