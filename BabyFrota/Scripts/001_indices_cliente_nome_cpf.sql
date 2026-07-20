-- =====================================================================================
-- Índices em Cliente.Nome e Cliente.CPF
-- =====================================================================================
-- Problema: a tabela Cliente não tem nenhum índice em Nome nem em CPF. Isso significa que:
--   - toda busca de cliente por nome (listagem, autocomplete na tela de Entrega)
--   - toda validação de CPF único (executada a CADA cadastro/edição de cliente)
-- faz uma varredura completa (table scan) da tabela inteira, prendendo locks de leitura
-- nela enquanto roda. Em uma tabela de produção com muitos registros, isso fica lento e,
-- combinado com escritas concorrentes (criar/editar cliente), pode travar outras operações
-- que dependem da mesma tabela — o efeito percebido é "o sistema trava e tudo fica
-- carregando para sempre depois de mexer em Clientes".
--
-- Este script cria dois índices não-clusterizados para resolver isso. É seguro rodar em
-- produção (não altera dados, só acelera leituras) mas pode demorar alguns segundos/minutos
-- dependendo do tamanho da tabela — rode em um horário de menor uso se possível.
--
-- Como rodar: abra este arquivo no SQL Server Management Studio (SSMS), conectado no banco
-- do BabyFrota, e execute (F5).
-- =====================================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Cliente_CPF' AND object_id = OBJECT_ID('dbo.Cliente')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Cliente_CPF ON dbo.Cliente (CPF);
    PRINT 'Índice IX_Cliente_CPF criado.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Cliente_CPF já existe — nada a fazer.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Cliente_Nome' AND object_id = OBJECT_ID('dbo.Cliente')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Cliente_Nome ON dbo.Cliente (Nome);
    PRINT 'Índice IX_Cliente_Nome criado.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Cliente_Nome já existe — nada a fazer.';
END
GO

-- =====================================================================================
-- Observação sobre a busca por nome (ex.: "buscar cliente por 'maria'"):
-- O sistema busca com "contém" (LIKE '%maria%'), que usa o índice apenas parcialmente
-- (ainda melhora bastante em relação a não ter índice nenhum, mas não é 100% otimizado
-- para busca por trecho no meio do texto). Se no futuro a busca por nome continuar lenta
-- mesmo com este índice, a solução definitiva seria habilitar Full-Text Search na coluna
-- Nome — pode ser feito depois, sem pressa, se necessário.
-- =====================================================================================

-- =====================================================================================
-- Recomendação adicional (fora do escopo deste script, decisão do DBA/responsável pelo
-- banco): verificar se READ_COMMITTED_SNAPSHOT está habilitado no banco. Sem isso, leituras
-- podem ficar bloqueadas esperando escritas em andamento na mesma tabela (comportamento
-- padrão do SQL Server), o que agrava exatamente o tipo de travamento relatado. Para checar:
--
--   SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = 'NOME_DO_BANCO';
--
-- Se retornar 0, habilitar com (idealmente em janela de manutenção, exige que não haja
-- transações ativas no momento):
--
--   ALTER DATABASE NOME_DO_BANCO SET READ_COMMITTED_SNAPSHOT ON;
-- =====================================================================================
