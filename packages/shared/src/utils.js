"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarNatureza = normalizarNatureza;
exports.padSubelemento = padSubelemento;
exports.buildQrText = buildQrText;
exports.gerarCodigoInterno = gerarCodigoInterno;
exports.parseCurrencyBR = parseCurrencyBR;
exports.formatCurrencyBR = formatCurrencyBR;
function normalizarNatureza(s) {
    if (!s || typeof s !== 'string')
        return '';
    const parts = String(s).trim().split('.').filter(Boolean);
    if (parts.length < 4)
        return String(s).trim();
    return (parts[0] +
        '.' +
        parts[1] +
        '.' +
        String(parts[2]).padStart(2, '0') +
        '.' +
        String(parts[3]).padStart(2, '0'));
}
function padSubelemento(sub) {
    if (!sub)
        return '';
    return String(sub).trim().padStart(2, '0');
}
function buildQrText(empenho, configQr) {
    const sep = (configQr.separador || ';').replace('\\t', '\t');
    const campos = (configQr.campos || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    const parts = campos.map((campo) => {
        const v = empenho[campo];
        return v !== null && v !== undefined && v !== '' ? String(v) : '';
    });
    return parts.join(sep);
}
function gerarCodigoInterno(id) {
    return 'E' + String(id).padStart(6, '0');
}
function parseCurrencyBR(value) {
    if (!value)
        return 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}
function formatCurrencyBR(value) {
    if (value === null || value === undefined)
        return '';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
//# sourceMappingURL=utils.js.map