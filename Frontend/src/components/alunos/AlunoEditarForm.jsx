import FotoAlunoInput
    from './FotoAlunoInput';


function dataParaExibicao(data) {
    if (!data) {
        return '';
    }

    if (/^\d{0,2}(\/\d{0,2})?(\/\d{0,4})?$/.test(data)) {
        return data;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    return data;
}


function formatarEntradaData(valor) {
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


function dataParaApi(data) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        return data;
    }

    const [dia, mes, ano] = data.split('/');

    return `${ano}-${mes}-${dia}`;
}


function AlunoEditarForm({
    nome,
    dataNascimento,
    fotoUrl,
    fotoArquivo,
    removerFoto,
    salvando,
    onNomeChange,
    onDataChange,
    onFotoArquivoChange,
    onRemoverFotoChange,
    onCancelar,
    onSubmit
}) {
    function handleDataChange(event) {
        const dataFormatada =
            formatarEntradaData(
                event.target.value
            );

        onDataChange(
            dataParaApi(
                dataFormatada
            )
        );
    }


    return (
        <section className="ficha-card">
            <div className="ficha-card-header">
                <div>
                    <h2>Editar aluno</h2>
                    <p>
                        Altere os dados, a foto e clique em salvar.
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="ficha-formulario ficha-formulario-aluno">
                    <div className="ficha-formulario-foto">
                        <FotoAlunoInput
                            nome={nome}
                            fotoAtual={fotoUrl}
                            arquivo={fotoArquivo}
                            removerFoto={removerFoto}
                            disabled={salvando}
                            onSelecionarArquivo={(arquivo) => {
                                onFotoArquivoChange(arquivo);
                                onRemoverFotoChange(false);
                            }}
                            onRemoverFoto={() => {
                                onFotoArquivoChange(null);
                                onRemoverFotoChange(true);
                            }}
                        />
                    </div>

                    <div className="campo-formulario">
                        <label htmlFor="editar-nome">
                            Nome do aluno{' '}
                            <span className="campo-obrigatorio">*</span>
                        </label>

                        <input
                            id="editar-nome"
                            type="text"
                            maxLength={150}
                            value={nome}
                            onChange={(event) => onNomeChange(event.target.value)}
                            disabled={salvando}
                        />
                    </div>

                    <div className="campo-formulario">
                        <label htmlFor="editar-nascimento">
                            Data de nascimento
                        </label>

                        <input
                            id="editar-nascimento"
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="dd/mm/aaaa"
                            value={dataParaExibicao(dataNascimento)}
                            onChange={handleDataChange}
                            disabled={salvando}
                        />
                    </div>
                </div>

                <footer className="ficha-formulario-acoes">
                    <button
                        type="button"
                        className="botao-secundario"
                        onClick={onCancelar}
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
                                : 'Salvar alterações'
                        }
                    </button>
                </footer>
            </form>
        </section>
    );
}


export default AlunoEditarForm;
