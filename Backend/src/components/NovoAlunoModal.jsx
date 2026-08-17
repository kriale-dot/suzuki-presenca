import {
    useEffect,
    useState
} from 'react';

import {
    apiPostFormData
} from '../services/api';

import FotoAlunoInput
    from './alunos/FotoAlunoInput';


function formatarDataDigitada(valor) {
    const numeros = valor
        .replace(/\D/g, '')
        .slice(0, 8);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 4) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}


function dataBrasileiraValida(data) {
    if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(data)) {
        return false;
    }

    const [diaTexto, mesTexto, anoTexto] = data.split('/');
    const dia = Number(diaTexto);
    const mes = Number(mesTexto);
    const ano = Number(anoTexto);

    const objetoData = new Date(
        ano,
        mes - 1,
        dia
    );

    return (
        objetoData.getFullYear() === ano
        &&
        objetoData.getMonth() === mes - 1
        &&
        objetoData.getDate() === dia
    );
}


function dataParaApi(data) {
    if (!data) {
        return '';
    }

    const [dia, mes, ano] = data.split('/');

    return `${ano}-${mes}-${dia}`;
}


function NovoAlunoModal({
    aberto,
    onFechar,
    onCriado
}) {
    const [nome, setNome] =
        useState('');

    const [dataNascimento, setDataNascimento] =
        useState('');

    const [fotoArquivo, setFotoArquivo] =
        useState(null);

    const [salvando, setSalvando] =
        useState(false);

    const [erro, setErro] =
        useState('');


    useEffect(
        () => {
            if (!aberto) {
                return;
            }

            setNome('');
            setDataNascimento('');
            setFotoArquivo(null);
            setSalvando(false);
            setErro('');
        },
        [aberto]
    );


    if (!aberto) {
        return null;
    }


    function fecharPeloFundo(event) {
        if (
            event.target === event.currentTarget
            &&
            !salvando
        ) {
            onFechar();
        }
    }


    function handleDataChange(event) {
        setDataNascimento(
            formatarDataDigitada(
                event.target.value
            )
        );
    }


    async function handleSubmit(event) {
        event.preventDefault();

        const nomeLimpo =
            nome.trim();

        setErro('');

        if (!nomeLimpo) {
            setErro(
                'Informe o nome do aluno.'
            );
            return;
        }

        if (
            dataNascimento
            &&
            !dataBrasileiraValida(
                dataNascimento
            )
        ) {
            setErro(
                'Informe uma data de nascimento válida no formato dd/mm/aaaa.'
            );
            return;
        }

        try {
            setSalvando(true);

            const formData =
                new FormData();

            formData.append(
                'nome',
                nomeLimpo
            );

            formData.append(
                'data_nascimento',
                dataNascimento
                    ? dataParaApi(dataNascimento)
                    : ''
            );

            if (fotoArquivo) {
                formData.append(
                    'foto',
                    fotoArquivo
                );
            }

            const resposta =
                await apiPostFormData(
                    '/alunos',
                    formData
                );

            await onCriado(
                resposta.dados
            );

            onFechar();

        } catch (err) {
            console.error(err);

            setErro(
                err.message
                ||
                'Não foi possível cadastrar o aluno.'
            );

        } finally {
            setSalvando(false);
        }
    }


    return (
        <div
            className="modal-overlay"
            onMouseDown={fecharPeloFundo}
        >
            <section
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="novo-aluno-titulo"
            >
                <header className="modal-header">
                    <div>
                        <h2 id="novo-aluno-titulo">
                            Novo aluno
                        </h2>

                        <p>
                            Preencha os dados básicos e, se desejar, adicione uma foto.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-fechar"
                        onClick={onFechar}
                        disabled={salvando}
                        aria-label="Fechar janela"
                    >
                        ×
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <FotoAlunoInput
                            nome={nome}
                            fotoAtual={null}
                            arquivo={fotoArquivo}
                            removerFoto={false}
                            disabled={salvando}
                            onSelecionarArquivo={setFotoArquivo}
                            onRemoverFoto={() => setFotoArquivo(null)}
                        />

                        <div className="campo-formulario">
                            <label htmlFor="nome">
                                Nome do aluno{' '}
                                <span className="campo-obrigatorio">*</span>
                            </label>

                            <input
                                id="nome"
                                type="text"
                                autoFocus
                                maxLength={150}
                                placeholder="Digite o nome completo"
                                value={nome}
                                onChange={(event) => setNome(event.target.value)}
                                disabled={salvando}
                            />
                        </div>

                        <div className="campo-formulario">
                            <label htmlFor="data-nascimento">
                                Data de nascimento
                            </label>

                            <input
                                id="data-nascimento"
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="dd/mm/aaaa"
                                value={dataNascimento}
                                onChange={handleDataChange}
                                disabled={salvando}
                            />
                        </div>

                        {
                            erro
                            &&
                            (
                                <div className="mensagem-erro">
                                    {erro}
                                </div>
                            )
                        }
                    </div>

                    <footer className="modal-footer">
                        <button
                            type="button"
                            className="botao-secundario"
                            onClick={onFechar}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="botao-primario"
                            disabled={salvando}
                        >
                            {
                                salvando
                                    ? 'Salvando...'
                                    : 'Cadastrar aluno'
                            }
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}


export default NovoAlunoModal;
