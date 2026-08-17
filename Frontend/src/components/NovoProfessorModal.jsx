import { useEffect, useState } from 'react';
import { apiPost } from '../services/api';

function NovoProfessorModal({ aberto, onFechar, onCriado }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!aberto) return;
        setNome('');
        setEmail('');
        setTelefone('');
        setErro('');
        setSalvando(false);
    }, [aberto]);

    if (!aberto) return null;

    async function handleSubmit(event) {
        event.preventDefault();
        setErro('');

        const nomeLimpo = nome.trim();
        const emailLimpo = email.trim();
        const telefoneLimpo = telefone.trim();

        if (!nomeLimpo) {
            setErro('Informe o nome do professor.');
            return;
        }

        try {
            setSalvando(true);
            const resposta = await apiPost('/professores', {
                nome: nomeLimpo,
                email: emailLimpo || null,
                telefone: telefoneLimpo || null
            });

            await onCriado(resposta.dados);
            onFechar();
        } catch (err) {
            console.error(err);
            setErro(err.message || 'Não foi possível cadastrar o professor.');
        } finally {
            setSalvando(false);
        }
    }

    function handleOverlayClick(event) {
        if (event.target === event.currentTarget && !salvando) {
            onFechar();
        }
    }

    return (
        <div className="modal-overlay" onMouseDown={handleOverlayClick}>
            <section className="modal" role="dialog" aria-modal="true" aria-labelledby="novo-professor-titulo">
                <header className="modal-header">
                    <div>
                        <h2 id="novo-professor-titulo">Novo professor</h2>
                        <p>Preencha os dados básicos do professor.</p>
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
                        <div className="campo-formulario">
                            <label htmlFor="professor-nome">
                                Nome do professor <span className="campo-obrigatorio">*</span>
                            </label>
                            <input
                                id="professor-nome"
                                type="text"
                                autoFocus
                                maxLength={150}
                                value={nome}
                                onChange={(event) => setNome(event.target.value)}
                                disabled={salvando}
                                placeholder="Digite o nome completo"
                            />
                        </div>

                        <div className="campo-formulario">
                            <label htmlFor="professor-email">E-mail</label>
                            <input
                                id="professor-email"
                                type="email"
                                maxLength={150}
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                disabled={salvando}
                                placeholder="professor@exemplo.com"
                            />
                            <small>Campo opcional</small>
                        </div>

                        <div className="campo-formulario">
                            <label htmlFor="professor-telefone">Telefone</label>
                            <input
                                id="professor-telefone"
                                type="tel"
                                maxLength={30}
                                value={telefone}
                                onChange={(event) => setTelefone(event.target.value)}
                                disabled={salvando}
                                placeholder="(00) 00000-0000"
                            />
                            <small>Campo opcional</small>
                        </div>

                        {erro && <div className="formulario-erro">{erro}</div>}
                    </div>

                    <footer className="modal-footer">
                        <button type="button" className="botao-secundario" onClick={onFechar} disabled={salvando}>
                            Cancelar
                        </button>
                        <button type="submit" className="botao-primario" disabled={salvando}>
                            {salvando ? 'Cadastrando...' : 'Cadastrar professor'}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

export default NovoProfessorModal;
