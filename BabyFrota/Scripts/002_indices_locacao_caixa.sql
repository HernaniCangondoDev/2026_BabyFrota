-- =====================================================================================
-- Índices em Locacao para o Fluxo de Caixa, o fechamento de caixa e a fila de devoluções
-- =====================================================================================
-- Problema: a tabela Locacao (centenas de milhares de linhas em produção) só tem índices em
-- DTEntrega e CDCliente. Estas consultas, todas por caixa ou por "ainda não devolvida", não
-- têm índice de apoio e leem a tabela inteira:
--   - apuração de um caixa (total vendido, troco, pendências): usada no fechamento e na
--     tela de caixa aberto;
--   - Fluxo de Caixa: a mesma apuração para todos os caixas do período filtrado, mais o
--     ranking de recebimento por usuário (CDUsuarioDevolucao);
--   - bloqueio de fechamento com devoluções pendentes;
--   - fila "Troca e Devolução" (locações com DTDevolucao IS NULL, mais recentes primeiro).
--
-- Este script cria dois índices não-clusterizados. É seguro rodar em produção (não altera
-- dados, só acelera leituras; cada escrita em Locacao passa a atualizar também estes índices,
-- custo desprezível neste volume), mas a criação pode levar de alguns segundos a poucos
-- minutos — rode em um horário de menor uso se possível. É idempotente: pode rodar de novo.
--
-- Como rodar: abra este arquivo no SQL Server Management Studio (SSMS), conectado no banco
-- do BabyFrota, e execute (F5).
-- =====================================================================================

-- 1) Apuração por caixa: cobre CDCaixaMovimento + DTDevolucao e traz junto as colunas somadas,
--    então o SQL Server responde só pelo índice, sem voltar à tabela.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Locacao_CDCaixaMovimento_DTDevolucao' AND object_id = OBJECT_ID('dbo.Locacao')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Locacao_CDCaixaMovimento_DTDevolucao
        ON dbo.Locacao (CDCaixaMovimento, DTDevolucao)
        INCLUDE (ValorTotal, Troco, CDUsuarioDevolucao);
    PRINT 'Índice IX_Locacao_CDCaixaMovimento_DTDevolucao criado.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Locacao_CDCaixaMovimento_DTDevolucao já existe — nada a fazer.';
END
GO

-- 2) Fila de devoluções: índice FILTRADO, só com as locações ainda em andamento (poucas), então
--    é minúsculo e a lista abre sem varrer o histórico. Índices filtrados exigem
--    QUOTED_IDENTIFIER ON nas sessões que gravam em Locacao; é o padrão do SqlClient/EF
--    (sistema novo e legado), então não muda nada no dia a dia.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_Locacao_EmAndamento' AND object_id = OBJECT_ID('dbo.Locacao')
)
BEGIN
    SET QUOTED_IDENTIFIER ON;
    CREATE NONCLUSTERED INDEX IX_Locacao_EmAndamento
        ON dbo.Locacao (DTEntrega DESC)
        INCLUDE (CDCliente, CDCarrinho, CDCaixaMovimento)
        WHERE DTDevolucao IS NULL;
    PRINT 'Índice IX_Locacao_EmAndamento criado.';
END
ELSE
BEGIN
    PRINT 'Índice IX_Locacao_EmAndamento já existe — nada a fazer.';
END
GO
