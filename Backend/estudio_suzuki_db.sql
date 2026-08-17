-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 10/08/2026 às 14:11
-- Versão do servidor: 11.4.2-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `estudio_suzuki_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `alunos`
--

CREATE TABLE `alunos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `alunos`
--

INSERT INTO `alunos` (`id`, `nome`, `data_nascimento`, `foto_url`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Ana Beatriz', '2017-05-12', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(2, 'Bruno Henrique', '2016-09-20', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(3, 'Clara Martins', '2018-02-07', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(4, 'Gabriel Silva', '2017-11-18', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(5, 'Lucas Almeida', '2016-04-25', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(6, 'Mariana Santos', '2018-08-14', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46');

-- --------------------------------------------------------

--
-- Estrutura para tabela `aluno_responsavel`
--

CREATE TABLE `aluno_responsavel` (
  `aluno_id` int(10) UNSIGNED NOT NULL,
  `responsavel_id` int(10) UNSIGNED NOT NULL,
  `parentesco` varchar(50) DEFAULT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `aulas`
--

CREATE TABLE `aulas` (
  `id` int(10) UNSIGNED NOT NULL,
  `turma_id` int(10) UNSIGNED NOT NULL,
  `professor_id` int(10) UNSIGNED NOT NULL,
  `data_aula` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `tipo` enum('regular','reposicao','extra') NOT NULL DEFAULT 'regular',
  `status` enum('agendada','aberta','encerrada','cancelada') NOT NULL DEFAULT 'agendada',
  `aberta_em` datetime DEFAULT NULL,
  `encerrada_em` datetime DEFAULT NULL,
  `motivo_cancelamento` varchar(255) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `aulas`
--

INSERT INTO `aulas` (`id`, `turma_id`, `professor_id`, `data_aula`, `hora_inicio`, `hora_fim`, `tipo`, `status`, `aberta_em`, `encerrada_em`, `motivo_cancelamento`, `criado_em`, `atualizado_em`) VALUES
(1, 1, 2, '2026-08-11', '14:00:00', '15:00:00', 'regular', 'aberta', '2026-08-10 08:08:56', NULL, NULL, '2026-08-10 11:08:56', '2026-08-10 11:08:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `aula_alunos`
--

CREATE TABLE `aula_alunos` (
  `id` int(10) UNSIGNED NOT NULL,
  `aula_id` int(10) UNSIGNED NOT NULL,
  `aluno_id` int(10) UNSIGNED NOT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `aula_alunos`
--

INSERT INTO `aula_alunos` (`id`, `aula_id`, `aluno_id`, `criado_em`) VALUES
(1, 1, 1, '2026-08-10 11:15:55'),
(2, 1, 2, '2026-08-10 11:15:55'),
(3, 1, 3, '2026-08-10 11:15:55');

-- --------------------------------------------------------

--
-- Estrutura para tabela `dispositivos`
--

CREATE TABLE `dispositivos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `identificador` varchar(150) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `ultimo_acesso` datetime DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `dispositivos`
--

INSERT INTO `dispositivos` (`id`, `nome`, `identificador`, `ativo`, `ultimo_acesso`, `criado_em`, `atualizado_em`) VALUES
(1, 'Tablet Sala 1', 'tablet-sala-1', 1, NULL, '2026-08-10 11:08:17', '2026-08-10 11:08:17');

-- --------------------------------------------------------

--
-- Estrutura para tabela `horarios`
--

CREATE TABLE `horarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `turma_id` int(10) UNSIGNED NOT NULL,
  `dia_semana` tinyint(3) UNSIGNED NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp()
) ;

--
-- Despejando dados para a tabela `horarios`
--

INSERT INTO `horarios` (`id`, `turma_id`, `dia_semana`, `hora_inicio`, `hora_fim`, `ativo`, `criado_em`) VALUES
(1, 1, 2, '14:00:00', '15:00:00', 1, '2026-08-10 10:58:28'),
(2, 2, 3, '16:00:00', '17:00:00', 1, '2026-08-10 10:58:28');

-- --------------------------------------------------------

--
-- Estrutura para tabela `modalidades`
--

CREATE TABLE `modalidades` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `modalidades`
--

INSERT INTO `modalidades` (`id`, `nome`, `ativo`, `criado_em`) VALUES
(1, 'Violino', 1, '2026-08-10 10:47:46'),
(2, 'Piano', 1, '2026-08-10 10:47:46'),
(3, 'Violoncelo', 1, '2026-08-10 10:47:46'),
(4, 'Musicalização', 1, '2026-08-10 10:47:46');

-- --------------------------------------------------------

--
-- Estrutura para tabela `presencas`
--

CREATE TABLE `presencas` (
  `id` int(10) UNSIGNED NOT NULL,
  `aula_aluno_id` int(10) UNSIGNED NOT NULL,
  `situacao` enum('presente','ausente','justificada') NOT NULL,
  `origem` enum('aluno','professor','secretaria') NOT NULL,
  `dispositivo_id` int(10) UNSIGNED DEFAULT NULL,
  `registrado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `observacao` varchar(500) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `professores`
--

CREATE TABLE `professores` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `professores`
--

INSERT INTO `professores` (`id`, `nome`, `email`, `telefone`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Carlos Suzuki', 'carlos@exemplo.com', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46'),
(2, 'Mariana Oliveira', 'mariana@exemplo.com', NULL, 1, '2026-08-10 10:47:46', '2026-08-10 10:47:46');

-- --------------------------------------------------------

--
-- Estrutura para tabela `responsaveis`
--

CREATE TABLE `responsaveis` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) NOT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `turmas`
--

CREATE TABLE `turmas` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) NOT NULL,
  `modalidade_id` int(10) UNSIGNED NOT NULL,
  `professor_id` int(10) UNSIGNED NOT NULL,
  `tipo` enum('individual','coletiva') NOT NULL,
  `sala` varchar(80) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `turmas`
--

INSERT INTO `turmas` (`id`, `nome`, `modalidade_id`, `professor_id`, `tipo`, `sala`, `ativo`, `criado_em`, `atualizado_em`) VALUES
(1, 'Violino Infantil A', 1, 2, 'coletiva', 'Sala 1', 1, '2026-08-10 10:58:02', '2026-08-10 10:58:02'),
(2, 'Piano - Lucas', 2, 1, 'individual', 'Sala 2', 1, '2026-08-10 10:58:02', '2026-08-10 10:58:02');

-- --------------------------------------------------------

--
-- Estrutura para tabela `turma_alunos`
--

CREATE TABLE `turma_alunos` (
  `id` int(10) UNSIGNED NOT NULL,
  `turma_id` int(10) UNSIGNED NOT NULL,
  `aluno_id` int(10) UNSIGNED NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `turma_alunos`
--

INSERT INTO `turma_alunos` (`id`, `turma_id`, `aluno_id`, `data_inicio`, `data_fim`, `ativo`, `criado_em`) VALUES
(1, 1, 1, '2026-08-01', NULL, 1, '2026-08-10 10:58:50'),
(2, 1, 2, '2026-08-01', NULL, 1, '2026-08-10 10:58:50'),
(3, 1, 3, '2026-08-01', NULL, 1, '2026-08-10 10:58:50'),
(4, 2, 5, '2026-08-01', NULL, 1, '2026-08-10 10:59:19');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `alunos`
--
ALTER TABLE `alunos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `aluno_responsavel`
--
ALTER TABLE `aluno_responsavel`
  ADD PRIMARY KEY (`aluno_id`,`responsavel_id`),
  ADD KEY `fk_aluno_responsavel_responsavel` (`responsavel_id`);

--
-- Índices de tabela `aulas`
--
ALTER TABLE `aulas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_aula_turma_data_hora` (`turma_id`,`data_aula`,`hora_inicio`),
  ADD KEY `fk_aulas_professor` (`professor_id`);

--
-- Índices de tabela `aula_alunos`
--
ALTER TABLE `aula_alunos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_aula_aluno` (`aula_id`,`aluno_id`),
  ADD KEY `fk_aula_alunos_aluno` (`aluno_id`);

--
-- Índices de tabela `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificador` (`identificador`);

--
-- Índices de tabela `horarios`
--
ALTER TABLE `horarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_horarios_turma` (`turma_id`);

--
-- Índices de tabela `modalidades`
--
ALTER TABLE `modalidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `presencas`
--
ALTER TABLE `presencas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_presenca_aula_aluno` (`aula_aluno_id`),
  ADD KEY `fk_presenca_dispositivo` (`dispositivo_id`);

--
-- Índices de tabela `professores`
--
ALTER TABLE `professores`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `responsaveis`
--
ALTER TABLE `responsaveis`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `turmas`
--
ALTER TABLE `turmas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_turma_modalidade` (`modalidade_id`),
  ADD KEY `fk_turma_professor` (`professor_id`);

--
-- Índices de tabela `turma_alunos`
--
ALTER TABLE `turma_alunos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_turma_aluno` (`turma_id`,`aluno_id`,`data_inicio`),
  ADD KEY `fk_turma_alunos_aluno` (`aluno_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `alunos`
--
ALTER TABLE `alunos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `aulas`
--
ALTER TABLE `aulas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `aula_alunos`
--
ALTER TABLE `aula_alunos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `dispositivos`
--
ALTER TABLE `dispositivos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `horarios`
--
ALTER TABLE `horarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `modalidades`
--
ALTER TABLE `modalidades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `presencas`
--
ALTER TABLE `presencas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `professores`
--
ALTER TABLE `professores`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `responsaveis`
--
ALTER TABLE `responsaveis`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `turmas`
--
ALTER TABLE `turmas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `turma_alunos`
--
ALTER TABLE `turma_alunos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `aluno_responsavel`
--
ALTER TABLE `aluno_responsavel`
  ADD CONSTRAINT `fk_aluno_responsavel_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_aluno_responsavel_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsaveis` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `aulas`
--
ALTER TABLE `aulas`
  ADD CONSTRAINT `fk_aulas_professor` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_aulas_turma` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `aula_alunos`
--
ALTER TABLE `aula_alunos`
  ADD CONSTRAINT `fk_aula_alunos_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_aula_alunos_aula` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `horarios`
--
ALTER TABLE `horarios`
  ADD CONSTRAINT `fk_horarios_turma` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `presencas`
--
ALTER TABLE `presencas`
  ADD CONSTRAINT `fk_presenca_aula_aluno` FOREIGN KEY (`aula_aluno_id`) REFERENCES `aula_alunos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_presenca_dispositivo` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `turmas`
--
ALTER TABLE `turmas`
  ADD CONSTRAINT `fk_turma_modalidade` FOREIGN KEY (`modalidade_id`) REFERENCES `modalidades` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_turma_professor` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`) ON UPDATE CASCADE;

--
-- Restrições para tabelas `turma_alunos`
--
ALTER TABLE `turma_alunos`
  ADD CONSTRAINT `fk_turma_alunos_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_turma_alunos_turma` FOREIGN KEY (`turma_id`) REFERENCES `turmas` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
