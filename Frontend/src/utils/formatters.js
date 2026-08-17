export function formatarData(data) {
    if (!data) return 'Não informada';

    const [ano, mes, dia] = data.split('-');

    if (!ano || !mes || !dia) return data;

    return `${dia}/${mes}/${ano}`;
}

export function obterIniciais(nome = '') {
    const partes = nome.trim().split(/\s+/).filter(Boolean);

    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}
