// =====================================================
// URL BASE DA API
//
// Definida no arquivo .env:
//
// VITE_API_URL=http://localhost/estudio-suzuki-api/public/api
// =====================================================

const API_URL_CONFIGURADA =
    String(
        import.meta.env.VITE_API_URL
        ||
        ''
    ).trim();


if (!API_URL_CONFIGURADA) {

    throw new Error(
        'VITE_API_URL não foi configurada. Verifique o arquivo .env do frontend e reinicie o Vite.'
    );
}


const API_URL =
    API_URL_CONFIGURADA.replace(
        /\/+$/,
        ''
    );


const API_PUBLIC_URL =
    API_URL.replace(
        /\/api$/,
        ''
    );


// =====================================================
// FUNÇÃO PRINCIPAL DE REQUISIÇÃO
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    // -------------------------------------------------
    // Faz a requisição HTTP.
    // -------------------------------------------------

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,


                // =====================================
                // AUTENTICAÇÃO POR SESSÃO PHP
                //
                // Permite ao navegador receber e enviar
                // o cookie da sessão.
                // =====================================

                credentials:
                    'include',


                headers: {

                    /*
                     * Indicamos ao backend que esperamos
                     * uma resposta JSON.
                     */
                    Accept:
                        'application/json',


                    /*
                     * Só enviamos Content-Type JSON
                     * quando existe corpo na requisição.
                     */
                    ...(
                        options.body
                        &&
                        !(
                            typeof FormData !== 'undefined'
                            &&
                            options.body instanceof FormData
                        )

                            ? {
                                'Content-Type':
                                    'application/json'
                            }

                            : {}
                    ),


                    /*
                     * Permite acrescentar ou substituir
                     * cabeçalhos em chamadas futuras.
                     */
                    ...options.headers
                }
            }
        );


    // -------------------------------------------------
    // Primeiro lemos a resposta como texto.
    //
    // Isso permite tratar respostas vazias.
    // -------------------------------------------------

    const texto =
        await response.text();


    let data = {};


    // -------------------------------------------------
    // Se existe conteúdo, tentamos interpretar JSON.
    // -------------------------------------------------

    if (texto) {

        try {

            data =
                JSON.parse(
                    texto
                );

        } catch {

            const erro =
                new Error(
                    'O servidor retornou uma resposta inválida.'
                );


            erro.status =
                response.status;


            erro.data =
                null;


            throw erro;
        }
    }


    // =================================================
    // RESPOSTA HTTP COM ERRO
    // =================================================

if (!response.ok) {

    // ===============================================
    // SESSÃO EXPIRADA OU INVÁLIDA
    //
    // Avisamos toda a aplicação de que não existe
    // mais uma sessão autenticada.
    // ===============================================

    if (
        response.status === 401
        &&
        endpoint !== '/auth/login'
    ) {

        window.dispatchEvent(
            new CustomEvent(
                'suzuki:nao-autenticado'
            )
        );
    }


    const erro =
        new Error(
            data.mensagem
            ||
            `Erro HTTP ${response.status}.`
        );


    erro.status =
        response.status;


    erro.data =
        data;


    throw erro;
}


    // -------------------------------------------------
    // Requisição concluída com sucesso.
    // -------------------------------------------------

    return data;
}


// =====================================================
// GET
// =====================================================

export function apiGet(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method:
                'GET'
        }
    );
}


// =====================================================
// POST
// =====================================================

export function apiPost(
    endpoint,
    dados = {}
) {

    return apiRequest(
        endpoint,
        {
            method:
                'POST',

            body:
                JSON.stringify(
                    dados
                )
        }
    );
}


// =====================================================
// PUT
// =====================================================

export function apiPut(
    endpoint,
    dados = {}
) {

    return apiRequest(
        endpoint,
        {
            method:
                'PUT',

            body:
                JSON.stringify(
                    dados
                )
        }
    );
}


// =====================================================
// DELETE
// =====================================================

export function apiDelete(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method:
                'DELETE'
        }
    );
}

// =====================================================
// POST MULTIPART / FORM DATA
//
// Usado para upload de fotos.
// O navegador define automaticamente o Content-Type
// multipart/form-data com o boundary correto.
// =====================================================

export function apiPostFormData(
    endpoint,
    formData
) {

    return apiRequest(
        endpoint,
        {
            method:
                'POST',

            body:
                formData
        }
    );
}


// =====================================================
// URL DE ARQUIVO PÚBLICO DA API
//
// O backend grava a foto como:
// /uploads/alunos/arquivo.jpg
//
// Com:
// VITE_API_URL=http://192.168.15.8/estudio-suzuki-api/public/api
//
// obtemos:
// http://192.168.15.8/estudio-suzuki-api/public/uploads/alunos/arquivo.jpg
// =====================================================

export function apiArquivoUrl(
    caminho
) {

    if (!caminho) {
        return '';
    }


    const valor =
        String(
            caminho
        ).trim();


    if (!valor) {
        return '';
    }


    if (
        /^https?:\/\//i.test(
            valor
        )
        ||
        /^data:/i.test(
            valor
        )
        ||
        /^blob:/i.test(
            valor
        )
    ) {

        return valor;
    }


    const caminhoNormalizado =
        valor.startsWith('/')

            ? valor

            : `/${valor}`;


    return `${API_PUBLIC_URL}${caminhoNormalizado}`;
}

