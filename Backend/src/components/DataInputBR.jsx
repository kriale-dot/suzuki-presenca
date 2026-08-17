import {
    useEffect,
    useRef,
    useState
} from 'react';


// =====================================================
// CONVERTE DA API PARA EXIBIÇÃO
//
// 2026-08-12
//      ↓
// 12/08/2026
// =====================================================

function dataApiParaBr(
    data
) {

    if (!data) {
        return '';
    }


    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(data)
    ) {

        return data;
    }


    const [
        ano,
        mes,
        dia
    ] = data.split('-');


    return `${dia}/${mes}/${ano}`;
}


// =====================================================
// CONVERTE DA INTERFACE PARA API
//
// 12/08/2026
//      ↓
// 2026-08-12
// =====================================================

function dataBrParaApi(
    data
) {

    const [
        dia,
        mes,
        ano
    ] = data.split('/');


    return `${ano}-${mes}-${dia}`;
}


// =====================================================
// FORMATA DURANTE A DIGITAÇÃO
//
// 1
// 12
// 12/0
// 12/08
// 12/08/2
// 12/08/2026
// =====================================================

function formatarDigitacao(
    valor
) {

    const numeros =
        valor
            .replace(
                /\D/g,
                ''
            )
            .slice(
                0,
                8
            );


    if (
        numeros.length <= 2
    ) {

        return numeros;
    }


    if (
        numeros.length <= 4
    ) {

        return (
            `${numeros.slice(0, 2)}/`
            +
            numeros.slice(2)
        );
    }


    return (
        `${numeros.slice(0, 2)}/`
        +
        `${numeros.slice(2, 4)}/`
        +
        numeros.slice(4)
    );
}


// =====================================================
// VALIDA DD/MM/AAAA
// =====================================================

function dataValida(
    data
) {

    if (
        !/^\d{2}\/\d{2}\/\d{4}$/
            .test(data)
    ) {

        return false;
    }


    const [
        diaTexto,
        mesTexto,
        anoTexto
    ] = data.split('/');


    const dia =
        Number(
            diaTexto
        );


    const mes =
        Number(
            mesTexto
        );


    const ano =
        Number(
            anoTexto
        );


    const objeto =
        new Date(
            ano,
            mes - 1,
            dia
        );


    return (
        objeto.getFullYear()
            === ano
        &&
        objeto.getMonth()
            === mes - 1
        &&
        objeto.getDate()
            === dia
    );
}


// =====================================================
// COMPONENTE
//
// value:
//     YYYY-MM-DD
//
// onChange:
//     devolve YYYY-MM-DD
// =====================================================

function DataInputBR({
    id,
    value,
    onChange,
    disabled = false,
    required = false,
    placeholder = 'dd/mm/aaaa',
    className = '',
    ariaLabel
}) {

    // =================================================
    // TEXTO VISÍVEL
    // =================================================

    const [
        texto,
        setTexto
    ] = useState(
        () =>
            dataApiParaBr(
                value
            )
    );


    const [
        invalida,
        setInvalida
    ] = useState(false);


    /*
     * Guarda o último valor que este componente
     * enviou para o componente pai.
     *
     * Isso permite distinguir:
     *
     * - usuário digitando;
     * - mudança externa, como botão "Hoje".
     */
    const ultimoValor =
        useRef(
            value || ''
        );


    // =================================================
    // SINCRONIZA ALTERAÇÕES EXTERNAS
    //
    // Exemplo:
    //
    // botão "Hoje"
    //      ↓
    // Agenda muda dataSelecionada
    //      ↓
    // campo atualiza visualmente
    // =================================================

    useEffect(() => {

        const novoValor =
            value || '';


        if (
            novoValor
            !==
            ultimoValor.current
        ) {

            ultimoValor.current =
                novoValor;


            setTexto(
                dataApiParaBr(
                    novoValor
                )
            );


            setInvalida(
                false
            );
        }

    }, [
        value
    ]);


    // =================================================
    // DIGITAÇÃO
    // =================================================

    function handleChange(
        event
    ) {

        const valorFormatado =
            formatarDigitacao(
                event.target.value
            );


        setTexto(
            valorFormatado
        );


        setInvalida(
            false
        );


        // ---------------------------------------------
        // Campo apagado.
        // ---------------------------------------------

        if (
            valorFormatado === ''
        ) {

            ultimoValor.current =
                '';


            onChange(
                ''
            );


            return;
        }


        // ---------------------------------------------
        // Enquanto está incompleto,
        // não alteramos o valor externo.
        // ---------------------------------------------

        if (
            valorFormatado.length
            !==
            10
        ) {

            return;
        }


        // ---------------------------------------------
        // Data completa mas inválida.
        // ---------------------------------------------

        if (
            !dataValida(
                valorFormatado
            )
        ) {

            setInvalida(
                true
            );


            return;
        }


        // ---------------------------------------------
        // Data válida.
        // ---------------------------------------------

        const valorApi =
            dataBrParaApi(
                valorFormatado
            );


        ultimoValor.current =
            valorApi;


        onChange(
            valorApi
        );
    }


    // =================================================
    // AO SAIR DO CAMPO
    //
    // Se ficou incompleto ou inválido,
    // voltamos ao último valor válido.
    // =================================================

    function handleBlur() {

        if (
            texto === ''
        ) {

            setInvalida(
                false
            );

            return;
        }


        if (
            !dataValida(
                texto
            )
        ) {

            setTexto(
                dataApiParaBr(
                    value
                )
            );


            setInvalida(
                false
            );
        }
    }


    // =================================================
    // INTERFACE
    // =================================================

    return (

        <input
            id={
                id
            }

            type=
                "text"

            inputMode=
                "numeric"

            autoComplete=
                "off"

            placeholder={
                placeholder
            }

            maxLength={
                10
            }

            value={
                texto
            }

            onChange={
                handleChange
            }

            onBlur={
                handleBlur
            }

            disabled={
                disabled
            }

            required={
                required
            }

            aria-label={
                ariaLabel
            }

            aria-invalid={
                invalida
            }

            title={
                invalida
                    ? 'Digite uma data válida no formato dd/mm/aaaa'
                    : 'Formato: dd/mm/aaaa'
            }

            className={
                className
            }
        />
    );
}


export default DataInputBR;