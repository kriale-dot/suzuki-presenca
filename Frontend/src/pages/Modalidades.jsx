import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPut } from '../services/api';
import ModalidadeModal from '../components/ModalidadeModal';

function Modalidades() {
    const [modalidades, setModalidades] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [modalidadeEditando, setModalidadeEditando] = useState(null);
    const [processandoId, setProcessandoId] = useState(null);
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    const carregarModalidades = useCallback(async () => {
        try {
            setCarregando(true);
            setErro('');
            const resposta = await apiGet('/modalidades');
            setModalidades(resposta.dados || []);
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível carregar as modalidades.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarModalidades();
    }, [carregarModalidades]);

    useEffect(() => {
        if (!mensagemSucesso) return undefined;
        const timer = setTimeout(() => setMensagemSucesso(''), 3500);
        return () => clearTimeout(timer);
    }, [mensagemSucesso]);

    const modalidadesFiltradas = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        if (!texto) return modalidades;

        return modalidades.filter((modalidade) =>
            modalidade.nome.toLowerCase().includes(texto)
        );
    }, [modalidades, busca]);

    const totais = useMemo(() => {
        const ativas = modalidades.filter((item) => Number(item.ativo) === 1).length;
        return {
            total: modalidades.length,
            ativas,
            inativas: modalidades.length - ativas
        };
    }, [modalidades]);

    function abrirNovo() {
        setModalidadeEditando(null);
        setModalAberto(true);
    }

    function abrirEdicao(modalidade) {
        setModalidadeEditando(modalidade);
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setModalidadeEditando(null);
    }

    async function handleSalvo(acao) {
        await carregarModalidades();
        setMensagemSucesso(
            acao === 'editada'
                ? 'Modalidade atualizada com sucesso.'
                : 'Modalidade cadastrada com sucesso.'
        );
    }

    async function desativar(modalidade) {
        const confirmou = window.confirm(
            `Deseja desativar a modalidade ${modalidade.nome}?`
        );

        if (!confirmou) return;

        try {
            setProcessandoId(modalidade.id);
            setErro('');
            await apiDelete(`/modalidades/${modalidade.id}`);
            await carregarModalidades();
            setMensagemSucesso('Modalidade desativada com sucesso.');
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível desativar a modalidade.');
        } finally {
            setProcessandoId(null);
        }
    }

    async function reativar(modalidade) {
        try {
            setProcessandoId(modalidade.id);
            setErro('');
            await apiPut(`/modalidades/${modalidade.id}`, {
                nome: modalidade.nome,
                ativo: 1
            });
            await carregarModalidades();
            setMensagemSucesso('Modalidade reativada com sucesso.');
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível reativar a modalidade.');
        } finally {
            setProcessandoId(null);
        }
    }

    return (
        <div className="pagina">
            {mensagemSucesso && (
                <div className="toast-sucesso">
                    <span className="toast-icone">✓</span>
                    {mensagemSucesso}
                </div>
            )}

            <header className="pagina-header">
                <div>
                    <h1>Modalidades</h1>
                    <p>Organize os tipos de aula oferecidos pelo Estúdio Suzuki.</p>
                </div>

                <button type="button" className="botao-primario" onClick={abrirNovo}>
                    + Nova modalidade
                </button>
            </header>

            <section className="modalidades-resumo" aria-label="Resumo das modalidades">
                <div className="modalidade-resumo-card">
                    <span>Total</span>
                    <strong>{totais.total}</strong>
                </div>
                <div className="modalidade-resumo-card">
                    <span>Ativas</span>
                    <strong>{totais.ativas}</strong>
                </div>
                <div className="modalidade-resumo-card">
                    <span>Inativas</span>
                    <strong>{totais.inativas}</strong>
                </div>
            </section>

            <section className="barra-ferramentas">
                <div className="campo-busca">
                    <span>⌕</span>
                    <input
                        type="search"
                        placeholder="Buscar modalidade..."
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                    />
                </div>

                <span className="contador">
                    {modalidadesFiltradas.length}{' '}
                    {modalidadesFiltradas.length === 1 ? 'modalidade' : 'modalidades'}
                </span>
            </section>

            {erro && (
                <div className="mensagem-erro modalidades-erro">
                    <strong>Não foi possível concluir a operação.</strong>
                    <span>{erro}</span>
                    {modalidades.length === 0 && (
                        <div>
                            <button
                                type="button"
                                className="botao-secundario"
                                onClick={carregarModalidades}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}
                </div>
            )}

            {carregando && modalidades.length === 0 ? (
                <div className="estado-pagina">
                    <div className="spinner" />
                    <p>Carregando modalidades...</p>
                </div>
            ) : (
                <section className="lista-card modalidades-lista">
                    {modalidadesFiltradas.length === 0 ? (
                        <div className="estado-pagina">
                            <p>Nenhuma modalidade encontrada.</p>
                        </div>
                    ) : (
                        modalidadesFiltradas.map((modalidade) => {
                            const ativa = Number(modalidade.ativo) === 1;
                            const processando = processandoId === modalidade.id;

                            return (
                                <div className="modalidade-item" key={modalidade.id}>
                                    <div className="modalidade-icone" aria-hidden="true">♪</div>

                                    <div className="modalidade-info">
                                        <strong>{modalidade.nome}</strong>
                                        <span>
                                            {ativa
                                                ? 'Disponível para novas turmas'
                                                : 'Não disponível para novas turmas'}
                                        </span>
                                    </div>

                                    <div className="modalidade-status">
                                        <span className={`badge ${ativa ? 'ativo' : 'inativo'}`}>
                                            {ativa ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>

                                    <div className="modalidade-acoes">
                                        <button
                                            type="button"
                                            className="botao-secundario modalidade-botao"
                                            onClick={() => abrirEdicao(modalidade)}
                                            disabled={processando}
                                        >
                                            Editar
                                        </button>

                                        {ativa ? (
                                            <button
                                                type="button"
                                                className="botao-perigo-secundario modalidade-botao"
                                                onClick={() => desativar(modalidade)}
                                                disabled={processando}
                                            >
                                                {processando ? 'Aguarde...' : 'Desativar'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="botao-primario modalidade-botao"
                                                onClick={() => reativar(modalidade)}
                                                disabled={processando}
                                            >
                                                {processando ? 'Aguarde...' : 'Reativar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            )}

            <ModalidadeModal
                aberto={modalAberto}
                modalidade={modalidadeEditando}
                onFechar={fecharModal}
                onSalvo={handleSalvo}
            />
        </div>
    );
}

export default Modalidades;
