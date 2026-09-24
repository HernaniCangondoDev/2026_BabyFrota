using BabyFrota.Data;
using BabyFrota.Domain.Enums;
using BabyFrota.DTOs.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Dashboard;

/// <summary>
/// Primeira fatia de KPIs do dashboard BI. Conforme os módulos de Locação/Caixa forem
/// migrados, este serviço cresce (ticket médio por período, ranking de clientes, etc.).
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardResumoDto> ObterResumoAsync(CancellationToken ct = default)
    {
        var totalCarrinhos = await _db.Carrinhos.CountAsync(ct);
        var alugados = await _db.Carrinhos.CountAsync(c => c.Cdstatus == (int)SituacaoCarrinho.Alugado, ct);
        var disponiveis = await _db.Carrinhos.CountAsync(c => c.Cdstatus == (int)SituacaoCarrinho.Disponivel, ct);

        var caixaAberto = await _db.CaixaMovimentos
            .Where(c => c.Dtfechamento == null)
            .OrderByDescending(c => c.Dtabertura)
            .FirstOrDefaultAsync(ct);

        decimal? faturamentoCaixaAtual = null;
        if (caixaAberto is not null)
        {
            faturamentoCaixaAtual = await _db.Locacoes
                .Where(l => l.CdcaixaMovimento == caixaAberto.CdcaixaMovimento)
                .SumAsync(l => (decimal?)l.ValorTotal, ct) ?? 0m;
        }

        var hoje = DateTime.Today;
        var amanha = hoje.AddDays(1);

        var locacoesHoje = await _db.Locacoes
            .Where(l => l.Dtentrega >= hoje && l.Dtentrega < amanha)
            .ToListAsync(ct);

        var faturamentoHoje = locacoesHoje.Sum(l => l.ValorTotal ?? 0m);
        var qtdLocacoesHoje = locacoesHoje.Count;
        // Locação em andamento ainda não tem valor (só é cobrada na devolução): fora do denominador, para não derrubar o ticket médio.
        var qtdLocacoesConcluidasHoje = locacoesHoje.Count(l => l.Dtdevolucao != null);
        var ticketMedioHoje = qtdLocacoesConcluidasHoje > 0 ? faturamentoHoje / qtdLocacoesConcluidasHoje : 0m;

        var topCarrinhos = await _db.Locacoes
            .Where(l => l.Dtentrega >= hoje.AddDays(-30))
            .GroupBy(l => l.CdcarrinhoNavigation.Descricao)
            .Select(g => new CarrinhoMaisLocadoDto
            {
                Descricao = g.Key,
                QuantidadeLocacoes = g.Count(),
            })
            .OrderByDescending(x => x.QuantidadeLocacoes)
            .Take(5)
            .ToListAsync(ct);

        return new DashboardResumoDto
        {
            TotalCarrinhos = totalCarrinhos,
            CarrinhosDisponiveis = disponiveis,
            CarrinhosAlugados = alugados,
            PercentualOcupacao = totalCarrinhos == 0 ? 0 : Math.Round(alugados * 100.0 / totalCarrinhos, 1),
            CaixaAberto = caixaAberto is not null,
            FaturamentoCaixaAtual = faturamentoCaixaAtual,
            FaturamentoHoje = faturamentoHoje,
            LocacoesHoje = qtdLocacoesHoje,
            TicketMedioHoje = ticketMedioHoje,
            TopCarrinhos = topCarrinhos,
        };
    }
}
