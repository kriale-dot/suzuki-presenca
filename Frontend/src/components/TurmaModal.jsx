import {
    useEffect,
    useState
} from 'react';


import {
    apiGet,
    apiPost,
    apiPut
} from '../services/api';


function TurmaModal({
    aberto,
    turma,
    onFechar,
    onSalvo
}) {

    // Se recebemos uma turma, estamos editando.
    // Se não recebemos, estamos cadastrando.
    const editando =
        Boolean(turma);


    // ==================================================
    // CAMPOS
    // ==================================================

    const [nome, setNome] =
        useState('');


    const [
        modalidadeId,
        setModalidadeId
    ] = useState('');


    const [
        professorId,
        setProfessorId
    ] = useState('');


    const [tipo, setTipo] =
        useState('coletiva');


    const [sala, setSala] =
        useState('');


    // ==================================================
    // LISTAS
    // ==================================================

    const [
        modalidades,
        setModalidades
    ] = useState([]);


    const [
        professores,
        setProfessores
    ] = useState([]);


    // ==================================================
    // ESTADOS DA INTERFACE
    // ==================================================

    const [
        carregandoOpcoes,
        setCarregandoOpcoes
    ] = useState(false);


    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [erro, setErro] =
        useState('');


    // ==================================================
    // CARREGA DADOS AO ABRIR
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        // Preenche os campos.
        setNome(
            turma?.nome || ''
        );


        setModalidadeId(
            turma?.modalidade_id
                ? String(turma.modalidade_id)
                : ''
        );


        setProfessorId(
            turma?.professor_id
                ? String(turma.professor_id)
                : ''
        );


        setTipo(
            turma?.tipo || 'coletiva'
        );


        setSala(
            turma?.sala || ''
        );


        setErro('');

        setSalvando(false);


        // ----------------------------------------------
        // Carrega modalidades e professores
        // ----------------------------------------------

        async function carregarOpcoes() {

            try {

                setCarregandoOpcoes(true);


                const [
                    respostaModalidades,
                    respostaProfessores
                ] = await Promise.all([

                    apiGet('/modalidades'),

                    apiGet('/professores')

                ]);


                setModalidades(
                    respostaModalidades.dados || []
                );


                setProfessores(
                    respostaProfessores.dados || []
                );

            } catch (erro) {

                console.error(erro);


                setErro(
                    erro.message ||
                    'Não foi possível carregar modalidades e professores.'
                );

            } finally {

                setCarregandoOpcoes(false);
            }
        }


        carregarOpcoes();

    }, [
        aberto,
        turma
    ]);


    // ==================================================
    // MODAL FECHADO
    // ==================================================

    if (!aberto) {
        return null;
    }


    // ==================================================
    // FECHAR CLICANDO NO FUNDO
    // ==================================================

    function fecharPeloFundo(evento) {

        if (
            evento.target ===
            evento.currentTarget
            &&
            !salvando
        ) {

            onFechar();
        }
    }


    // ==================================================
    // MODALIDADES DISPONÍVEIS
    //
    // Em novo cadastro mostramos apenas ativas.
    //
    // Na edição também mantemos a modalidade atual,
    // mesmo que tenha sido desativada depois.
    // ==================================================

    const modalidadesDisponiveis =
        modalidades.filter(
            (modalidade) => {

                if (
                    Number(modalidade.ativo) === 1
                ) {
                    return true;
                }


                return (
                    editando
                    &&
                    Number(modalidade.id)
                        ===
                    Number(turma.modalidade_id)
                );
            }
        );


    // ==================================================
    // PROFESSORES DISPONÍVEIS
    // ==================================================

    const professoresDisponiveis =
        professores.filter(
            (professor) => {

                if (
                    Number(professor.ativo) === 1
                ) {
                    return true;
                }


                return (
                    editando
                    &&
                    Number(professor.id)
                        ===
                    Number(turma.professor_id)
                );
            }
        );


    // ==================================================
    // SALVAR
    // ==================================================

    async function salvar(evento) {

        evento.preventDefault();


        setErro('');


        const nomeLimpo =
            nome.trim();


        const salaLimpa =
            sala.trim();


        // ----------------------------------------------
        // Validações do frontend
        // ----------------------------------------------

        if (!nomeLimpo) {

            setErro(
                'Informe o nome da turma.'
            );

            return;
        }


        if (!modalidadeId) {

            setErro(
                'Selecione uma modalidade.'
            );

            return;
        }


        if (!professorId) {

            setErro(
                'Selecione um professor.'
            );

            return;
        }


        if (
            ![
                'individual',
                'coletiva'
            ].includes(tipo)
        ) {

            setErro(
                'Selecione o tipo da turma.'
            );

            return;
        }


        try {

            setSalvando(true);


            const dados = {

                nome:
                    nomeLimpo,

                modalidade_id:
                    Number(modalidadeId),

                professor_id:
                    Number(professorId),

                tipo,

                sala:
                    salaLimpa || null
            };


            if (editando) {

                await apiPut(
                    `/turmas/${turma.id}`,
                    {
                        ...dados,

                        ativo:
                            Number(turma.ativo)
                    }
                );

            } else {

                await apiPost(
                    '/turmas',
                    dados
                );
            }


            await onSalvo(
                editando
                    ? 'editada'
                    : 'criada'
            );


            onFechar();

        } catch (erro) {

            console.error(erro);


            setErro(
                erro.message ||
                (
                    editando
                        ? 'Não foi possível atualizar a turma.'
                        : 'Não foi possível cadastrar a turma.'
                )
            );

        } finally {

            setSalvando(false);
        }
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div
            className="modal-overlay"

            onMouseDown={
                fecharPeloFundo
            }
        >

            <section
                className="modal"

                role="dialog"

                aria-modal="true"

                aria-labelledby=
                    "turma-modal-titulo"
            >

                {/* ===================================
                    CABEÇALHO
                ==================================== */}

                <header className="modal-header">

                    <div>

                        <h2
                            id="turma-modal-titulo"
                        >

                            {
                                editando
                                    ? 'Editar turma'
                                    : 'Nova turma'
                            }

                        </h2>


                        <p>

                            {
                                editando
                                    ? 'Altere os dados da turma.'
                                    : 'Cadastre uma nova turma do Estúdio Suzuki.'
                            }

                        </p>

                    </div>


                    <button
                        type="button"

                        className="modal-fechar"

                        onClick={
                            onFechar
                        }

                        disabled={
                            salvando
                        }

                        aria-label=
                            "Fechar janela"
                    >
                        ×
                    </button>

                </header>


                {/* ===================================
                    FORMULÁRIO
                ==================================== */}

                <form
                    onSubmit={
                        salvar
                    }
                >

                    <div className="modal-body">


                        {
                            carregandoOpcoes

                            ? (

                                <div className="estado-modal">

                                    <div className="spinner" />

                                    <span>
                                        Carregando opções...
                                    </span>

                                </div>

                            )

                            : (

                                <>

                                    {/* =================
                                        NOME
                                    ================== */}

                                    <div className="campo-formulario">

                                        <label htmlFor="turma-nome">

                                            Nome da turma

                                            <span className="campo-obrigatorio">
                                                *
                                            </span>

                                        </label>


                                        <input
                                            id="turma-nome"

                                            type="text"

                                            autoFocus

                                            maxLength={150}

                                            placeholder=
                                                "Ex.: Violino Infantil A"

                                            value={
                                                nome
                                            }

                                            onChange={
                                                (evento) =>
                                                    setNome(
                                                        evento.target.value
                                                    )
                                            }

                                            disabled={
                                                salvando
                                            }
                                        />

                                    </div>


                                    {/* =================
                                        MODALIDADE
                                    ================== */}

                                    <div className="campo-formulario">

                                        <label htmlFor="turma-modalidade">

                                            Modalidade

                                            <span className="campo-obrigatorio">
                                                *
                                            </span>

                                        </label>


                                        <select
                                            id="turma-modalidade"

                                            value={
                                                modalidadeId
                                            }

                                            onChange={
                                                (evento) =>
                                                    setModalidadeId(
                                                        evento.target.value
                                                    )
                                            }

                                            disabled={
                                                salvando
                                            }
                                        >

                                            <option value="">
                                                Selecione uma modalidade
                                            </option>


                                            {
                                                modalidadesDisponiveis.map(
                                                    (modalidade) => (

                                                        <option
                                                            key={
                                                                modalidade.id
                                                            }

                                                            value={
                                                                modalidade.id
                                                            }
                                                        >
                                                            {
                                                                modalidade.nome
                                                            }

                                                            {
                                                                Number(
                                                                    modalidade.ativo
                                                                ) !== 1
                                                                    ? ' (inativa)'
                                                                    : ''
                                                            }
                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    {/* =================
                                        PROFESSOR
                                    ================== */}

                                    <div className="campo-formulario">

                                        <label htmlFor="turma-professor">

                                            Professor

                                            <span className="campo-obrigatorio">
                                                *
                                            </span>

                                        </label>


                                        <select
                                            id="turma-professor"

                                            value={
                                                professorId
                                            }

                                            onChange={
                                                (evento) =>
                                                    setProfessorId(
                                                        evento.target.value
                                                    )
                                            }

                                            disabled={
                                                salvando
                                            }
                                        >

                                            <option value="">
                                                Selecione um professor
                                            </option>


                                            {
                                                professoresDisponiveis.map(
                                                    (professor) => (

                                                        <option
                                                            key={
                                                                professor.id
                                                            }

                                                            value={
                                                                professor.id
                                                            }
                                                        >
                                                            {
                                                                professor.nome
                                                            }

                                                            {
                                                                Number(
                                                                    professor.ativo
                                                                ) !== 1
                                                                    ? ' (inativo)'
                                                                    : ''
                                                            }
                                                        </option>

                                                    )
                                                )
                                            }

                                        </select>

                                    </div>


                                    {/* =================
                                        TIPO
                                    ================== */}

                                    <div className="campo-formulario">

                                        <label htmlFor="turma-tipo">

                                            Tipo da turma

                                            <span className="campo-obrigatorio">
                                                *
                                            </span>

                                        </label>


                                        <select
                                            id="turma-tipo"

                                            value={
                                                tipo
                                            }

                                            onChange={
                                                (evento) =>
                                                    setTipo(
                                                        evento.target.value
                                                    )
                                            }

                                            disabled={
                                                salvando
                                            }
                                        >

                                            <option value="coletiva">
                                                Coletiva
                                            </option>

                                            <option value="individual">
                                                Individual
                                            </option>

                                        </select>

                                    </div>


                                    {/* =================
                                        SALA
                                    ================== */}

                                    <div className="campo-formulario">

                                        <label htmlFor="turma-sala">

                                            Sala

                                        </label>


                                        <input
                                            id="turma-sala"

                                            type="text"

                                            maxLength={80}

                                            placeholder=
                                                "Ex.: Sala 1"

                                            value={
                                                sala
                                            }

                                            onChange={
                                                (evento) =>
                                                    setSala(
                                                        evento.target.value
                                                    )
                                            }

                                            disabled={
                                                salvando
                                            }
                                        />


                                        <small>
                                            Campo opcional
                                        </small>

                                    </div>


                                    {/* =================
                                        ERRO
                                    ================== */}

                                    {erro && (

                                        <div className="formulario-erro">
                                            {erro}
                                        </div>

                                    )}

                                </>

                            )
                        }

                    </div>


                    {/* =================================
                        RODAPÉ
                    ================================== */}

                    <footer className="modal-footer">

                        <button
                            type="button"

                            className=
                                "botao-secundario"

                            onClick={
                                onFechar
                            }

                            disabled={
                                salvando
                            }
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"

                            className=
                                "botao-primario"

                            disabled={
                                salvando ||
                                carregandoOpcoes
                            }
                        >

                            {
                                salvando

                                    ? 'Salvando...'

                                    : editando

                                        ? 'Salvar alterações'

                                        : 'Cadastrar turma'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default TurmaModal;