import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { apiDelete, apiGet, apiPut } from '../services/api';
import { obterIniciais } from '../utils/formatters';

function ProfessorDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [professor, setProfessor] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState('');
    const [processandoExclusao, setProcessandoExclusao] = useState(false);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');

    const carregarProfessor = useCallback(async () => {
        try {
            setCarregando(true);
            setErro('');
            const resposta = await apiGet(`/professores/${id}`);
            setProfessor(resposta.dados);
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível carregar o professor.');
        } finally {
            setCarregando(false);
        }
    }, [id]);

    useEffect(() => {
        carregarProfessor();
    }, [carregarProfessor]);

    useEffect(() => {
        if (!mensagemSucesso) return undefined;
        const timer = setTimeout(() => setMensagemSucesso(''), 3500);
        return () => clearTimeout(timer);
    }, [mensagemSucesso]);

    function iniciarEdicao() {
        setNome(professor.nome || '');
        setEmail(professor.email || '');
        setTelefone(professor.telefone || '');
        setErro('');
        setEditando(true);
    }

    function cancelarEdicao() {
        setEditando(false);
        setErro('');
    }

    async function salvarEdicao(event) {
        event.preventDefault();
        const nomeLimpo = nome.trim();

        if (!nomeLimpo) {
            setErro('Informe o nome do professor.');
            return;
        }

        try {
            setSalvando(true);
            setErro('');
            await apiPut(`/professores/${id}`, {
                nome: nomeLimpo,
                email: email.trim() || null,
                telefone: telefone.trim() || null
            });
            await carregarProfessor();
            setEditando(false);
            setMensagemSucesso('Dados do professor atualizados com sucesso.');
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível atualizar o professor.');
        } finally {
            setSalvando(false);
        }
    }

    async function desativarProfessor() {
        const confirmou = window.confirm(`Deseja desativar ${professor.nome}?`);
        if (!confirmou) return;

        try {
            setSalvando(true);
            setErro('');
            await apiDelete(`/professores/${id}`);
            await carregarProfessor();
            setMensagemSucesso('Professor desativado com sucesso.');
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível desativar o professor.');
        } finally {
            setSalvando(false);
        }
    }

    async function reativarProfessor() {
        try {
            setSalvando(true);
            setErro('');
            await apiPut(`/professores/${id}`, { ativo: 1 });
            await carregarProfessor();
            setMensagemSucesso('Professor reativado com sucesso.');
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível reativar o professor.');
        } finally {
            setSalvando(false);
        }
    }

    async function excluirProfessorDefinitivamente() {
        if (Number(professor?.ativo) === 1) {
            window.alert('Desative o professor antes de tentar excluí-lo definitivamente.');
            return;
        }

        const confirmou = window.confirm(
            `Excluir definitivamente ${professor.nome}?

Esta operação não poderá ser desfeita. Se existir qualquer turma, aula ou usuário de acesso vinculado, o sistema bloqueará a exclusão.`
        );

        if (!confirmou) return;

        const confirmacaoDigitada = window.prompt(
            'Para confirmar, digite EXCLUIR:'
        );

        if (confirmacaoDigitada?.trim().toUpperCase() !== 'EXCLUIR') {
            return;
        }

        try {
            setProcessandoExclusao(true);
            setErro('');

            const resposta = await apiDelete(
                `/professores/${id}/definitivo`
            );

            window.alert(
                resposta.mensagem || 'Professor excluído definitivamente.'
            );

            navigate('/professores', { replace: true });
        } catch (err) {
            console.error('Erro ao excluir professor definitivamente:', err);
            window.alert(
                err.message || 'Não foi possível excluir definitivamente o professor.'
            );
        } finally {
            setProcessandoExclusao(false);
        }
    }

    if (carregando && !professor) {
        return (
            <div className="estado-pagina">
                <div className="spinner" />
                <p>Carregando professor...</p>
            </div>
        );
    }

    if (!professor) {
        return (
            <div className="pagina">
                <Link to="/professores" className="voltar-link">← Voltar para professores</Link>
                <div className="mensagem-erro">
                    <strong>Não foi possível abrir esta ficha.</strong>
                    <span>{erro}</span>
                    <div>
                        <button type="button" className="botao-secundario" onClick={carregarProfessor}>
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pagina">
            {mensagemSucesso && (
                <div className="toast-sucesso">
                    <span className="toast-icone">✓</span>
                    {mensagemSucesso}
                </div>
            )}

            <Link to="/professores" className="voltar-link">← Voltar para professores</Link>

            <header className="professor-detalhes-header">
                <div className="professor-identidade">
                    <div className="professor-avatar grande">
                        <span>{obterIniciais(professor.nome)}</span>
                    </div>

                    <div>
                        <div className="titulo-com-status">
                            <h1>{professor.nome}</h1>
                            <span className={`badge ${Number(professor.ativo) === 1 ? 'ativo' : 'inativo'}`}>
                                {Number(professor.ativo) === 1 ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                        <p>Ficha do professor</p>
                    </div>
                </div>

                {!editando && (
                    <div className="acoes-ficha">
                        <button type="button" className="botao-secundario" onClick={iniciarEdicao} disabled={salvando}>
                            Editar
                        </button>

                        {Number(professor.ativo) === 1 ? (
                            <button type="button" className="botao-perigo-secundario" onClick={desativarProfessor} disabled={salvando || processandoExclusao}>
                                Desativar
                            </button>
                        ) : (
                            <>
                                <button type="button" className="botao-primario" onClick={reativarProfessor} disabled={salvando || processandoExclusao}>
                                    Reativar professor
                                </button>

                                <button
                                    type="button"
                                    className="botao-perigo-secundario"
                                    onClick={excluirProfessorDefinitivamente}
                                    disabled={salvando || processandoExclusao}
                                >
                                    {processandoExclusao ? 'Excluindo...' : 'Excluir definitivamente'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </header>

            {Number(professor.ativo) === 0 && (
                <div
                    className="mensagem-erro"
                    style={{ marginBottom: '20px' }}
                >
                    <strong>Exclusão definitiva</strong>
                    <span>
                        Use esta opção apenas para um cadastro criado por engano. Professores com qualquer turma, aula ou usuário de acesso vinculado não poderão ser excluídos, preservando o histórico e a autenticação.
                    </span>
                </div>
            )}

            {erro && <div className="mensagem-erro ficha-erro">{erro}</div>}

            {!editando ? (
                <section className="ficha-card">
                    <div className="ficha-card-header">
                        <div>
                            <h2>Dados do professor</h2>
                            <p>Informações básicas do cadastro.</p>
                        </div>
                    </div>

                    <div className="professor-ficha-dados">
                        <div className="ficha-campo">
                            <span>Nome completo</span>
                            <strong>{professor.nome}</strong>
                        </div>
                        <div className="ficha-campo">
                            <span>E-mail</span>
                            <strong>{professor.email || 'Não informado'}</strong>
                        </div>
                        <div className="ficha-campo">
                            <span>Telefone</span>
                            <strong>{professor.telefone || 'Não informado'}</strong>
                        </div>
                        <div className="ficha-campo">
                            <span>Situação</span>
                            <strong>{Number(professor.ativo) === 1 ? 'Professor ativo' : 'Professor inativo'}</strong>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="ficha-card">
                    <div className="ficha-card-header">
                        <div>
                            <h2>Editar professor</h2>
                            <p>Altere os dados e clique em salvar.</p>
                        </div>
                    </div>

                    <form onSubmit={salvarEdicao}>
                        <div className="professor-formulario">
                            <div className="campo-formulario">
                                <label htmlFor="editar-professor-nome">
                                    Nome do professor <span className="campo-obrigatorio">*</span>
                                </label>
                                <input
                                    id="editar-professor-nome"
                                    type="text"
                                    maxLength={150}
                                    value={nome}
                                    onChange={(event) => setNome(event.target.value)}
                                    disabled={salvando}
                                />
                            </div>

                            <div className="campo-formulario">
                                <label htmlFor="editar-professor-email">E-mail</label>
                                <input
                                    id="editar-professor-email"
                                    type="email"
                                    maxLength={150}
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={salvando}
                                />
                            </div>

                            <div className="campo-formulario">
                                <label htmlFor="editar-professor-telefone">Telefone</label>
                                <input
                                    id="editar-professor-telefone"
                                    type="tel"
                                    maxLength={30}
                                    value={telefone}
                                    onChange={(event) => setTelefone(event.target.value)}
                                    disabled={salvando}
                                />
                            </div>
                        </div>

                        <footer className="ficha-formulario-acoes">
                            <button type="button" className="botao-secundario" onClick={cancelarEdicao} disabled={salvando}>
                                Cancelar
                            </button>
                            <button type="submit" className="botao-primario" disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                        </footer>
                    </form>
                </section>
            )}
        </div>
    );
}

export default ProfessorDetalhes;
