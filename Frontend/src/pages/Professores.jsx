import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { apiGet } from '../services/api';
import NovoProfessorModal from '../components/NovoProfessorModal';
import { obterIniciais } from '../utils/formatters';

function Professores() {
    const [professores, setProfessores] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [modalNovoProfessor, setModalNovoProfessor] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    const carregarProfessores = useCallback(async () => {
        try {
            setCarregando(true);
            setErro('');
            const resposta = await apiGet('/professores');
            setProfessores(resposta.dados || []);
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível carregar os professores.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarProfessores();
    }, [carregarProfessores]);

    useEffect(() => {
        if (!mensagemSucesso) return undefined;
        const timer = setTimeout(() => setMensagemSucesso(''), 3500);
        return () => clearTimeout(timer);
    }, [mensagemSucesso]);

    async function handleProfessorCriado() {
        await carregarProfessores();
        setMensagemSucesso('Professor cadastrado com sucesso.');
    }

    const professoresFiltrados = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        if (!texto) return professores;

        return professores.filter((professor) => {
            const campos = [professor.nome, professor.email, professor.telefone]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return campos.includes(texto);
        });
    }, [professores, busca]);

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
                    <h1>Professores</h1>
                    <p>Consulte e administre os professores cadastrados.</p>
                </div>

                <button type="button" className="botao-primario" onClick={() => setModalNovoProfessor(true)}>
                    + Novo professor
                </button>
            </header>

            <section className="barra-ferramentas">
                <div className="campo-busca">
                    <span>⌕</span>
                    <input
                        type="search"
                        placeholder="Buscar professor..."
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                    />
                </div>

                <span className="contador">
                    {professoresFiltrados.length} {professoresFiltrados.length === 1 ? 'professor' : 'professores'}
                </span>
            </section>

            {carregando && (
                <div className="estado-pagina">
                    <div className="spinner" />
                    <p>Carregando professores...</p>
                </div>
            )}

            {!carregando && erro && (
                <div className="mensagem-erro">
                    <strong>Não foi possível carregar os professores.</strong>
                    <span>{erro}</span>
                    <div>
                        <button type="button" className="botao-secundario" onClick={carregarProfessores}>
                            Tentar novamente
                        </button>
                    </div>
                </div>
            )}

            {!carregando && !erro && (
                <section className="lista-card">
                    {professoresFiltrados.length === 0 ? (
                        <div className="estado-pagina"><p>Nenhum professor encontrado.</p></div>
                    ) : (
                        professoresFiltrados.map((professor) => (
                            <div className="professor-item" key={professor.id}>
                                <div className="professor-avatar">
                                    <span>{obterIniciais(professor.nome)}</span>
                                </div>

                                <div className="professor-info">
                                    <strong>{professor.nome}</strong>
                                    <span>{professor.email || 'E-mail não informado'}</span>
                                    {professor.telefone && <span>{professor.telefone}</span>}
                                </div>

                                <div className="professor-status">
                                    <span className={`badge ${Number(professor.ativo) === 1 ? 'ativo' : 'inativo'}`}>
                                        {Number(professor.ativo) === 1 ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <Link
                                    to={`/professores/${professor.id}`}
                                    className="botao-detalhes"
                                    aria-label={`Abrir ficha de ${professor.nome}`}
                                >
                                    ›
                                </Link>
                            </div>
                        ))
                    )}
                </section>
            )}

            <NovoProfessorModal
                aberto={modalNovoProfessor}
                onFechar={() => setModalNovoProfessor(false)}
                onCriado={handleProfessorCriado}
            />
        </div>
    );
}

export default Professores;
