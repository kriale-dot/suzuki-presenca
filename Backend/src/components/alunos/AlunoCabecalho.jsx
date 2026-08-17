import {
    apiArquivoUrl
} from '../../services/api';

import {
    obterIniciais
} from '../../utils/formatters';


function AlunoCabecalho({
    aluno,
    editando,
    salvando,
    onEditar,
    onDesativar,
    onReativar,
    onExcluirDefinitivamente,
    processandoExclusao = false
}) {
    const ativo =
        Number(aluno.ativo) === 1;

    const foto =
        apiArquivoUrl(
            aluno.foto_url
        );


    return (
        <header className="aluno-detalhes-header">
            <div className="aluno-identidade">
                <div className="aluno-avatar grande">
                    {
                        foto
                            ? (
                                <img
                                    src={foto}
                                    alt={aluno.nome}
                                />
                            )
                            : (
                                <span>
                                    {obterIniciais(aluno.nome)}
                                </span>
                            )
                    }
                </div>

                <div>
                    <div className="titulo-com-status">
                        <h1>{aluno.nome}</h1>

                        <span className={`badge ${ativo ? 'ativo' : 'inativo'}`}>
                            {ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>

                    <p>Ficha do aluno</p>
                </div>
            </div>

            {
                !editando
                &&
                (
                    <div className="acoes-ficha">
                        <button
                            type="button"
                            className="botao-secundario"
                            onClick={onEditar}
                            disabled={salvando}
                        >
                            Editar
                        </button>

                        {
                            ativo
                                ? (
                                    <button
                                        type="button"
                                        className="botao-perigo-secundario"
                                        onClick={onDesativar}
                                        disabled={salvando}
                                    >
                                        Desativar
                                    </button>
                                )
                                : (
                                    <>
                                        <button
                                            type="button"
                                            className="botao-primario"
                                            onClick={onReativar}
                                            disabled={
                                                salvando
                                                ||
                                                processandoExclusao
                                            }
                                        >
                                            Reativar aluno
                                        </button>

                                        <button
                                            type="button"
                                            className="botao-perigo-secundario"
                                            onClick={onExcluirDefinitivamente}
                                            disabled={
                                                salvando
                                                ||
                                                processandoExclusao
                                            }
                                        >
                                            {
                                                processandoExclusao
                                                    ? 'Excluindo...'
                                                    : 'Excluir definitivamente'
                                            }
                                        </button>
                                    </>
                                )
                        }
                    </div>
                )
            }
        </header>
    );
}


export default AlunoCabecalho;
