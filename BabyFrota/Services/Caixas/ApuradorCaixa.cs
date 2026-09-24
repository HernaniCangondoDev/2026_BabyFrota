using BabyFrota.Data;
using BabyFrota.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Caixas;

/// <summary>Dados mínimos de um caixa para apurá-lo.</summary>
internal readonly record struct CaixaBase(int Id, DateTime Dtabertura, decimal SuprimentoInicial, int CdusuarioAbertura);

/// <summary>O que o sistema apurou de um caixa. Vale igual no fechamento e no Fluxo de Caixa, por sair do mesmo cálculo.</summary>
internal sealed record ApuracaoCaixa(
    decimal TotalVendido,
    decimal Troco,
    int LocacoesDevolvidas,
    int LocacoesPendentes,
    decimal TotalGastos,
    decimal Reforcos,
    IReadOnlyDictionary<int, decimal> PorForma,
    decimal SaldoEmDinheiro,
    bool SomaFormasDiverge)
{
    public decimal DinheiroLiquido => PorForma.GetValueOrDefault((int)FormaRecebimentoPadrao.Dinheiro);
}

/// <summary>
/// Apura caixas com poucas consultas agregadas (em lote, não uma por caixa). Regras:
/// <list type="bullet">
/// <item>Só conta locação devolvida: o dinheiro entra na devolução.</item>
/// <item>O dinheiro é líquido de troco (o troco sai da gaveta), então as formas somam o total vendido.</item>
/// <item>O suprimento inicial não é contado duas vezes: o legado o grava também como linha de suprimento na abertura.</item>
/// </list>
/// </summary>
internal sealed class ApuradorCaixa
{
    private const decimal Tolerancia = 0.005m;

    private readonly AppDbContext _db;

    public ApuradorCaixa(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Dictionary<int, ApuracaoCaixa>> ApurarAsync(IReadOnlyCollection<CaixaBase> caixas, CancellationToken ct)
    {
        var resultado = new Dictionary<int, ApuracaoCaixa>();
        if (caixas.Count == 0)
            return resultado;

        var ids = caixas.Select(c => c.Id).ToList();

        var locacoes = (await _db.Locacoes
                .Where(l => ids.Contains(l.CdcaixaMovimento))
                .GroupBy(l => l.CdcaixaMovimento)
                .Select(g => new
                {
                    Caixa = g.Key,
                    Vendido = g.Sum(l => l.Dtdevolucao != null ? (l.ValorTotal ?? 0m) : 0m),
                    Troco = g.Sum(l => l.Dtdevolucao != null ? (l.Troco ?? 0m) : 0m),
                    Devolvidas = g.Count(l => l.Dtdevolucao != null),
                    Pendentes = g.Count(l => l.Dtdevolucao == null),
                })
                .ToListAsync(ct))
            .ToDictionary(x => x.Caixa);

        var parcelas = await _db.Parcelas
            .Where(p => p.CdlocacaoNavigation.Dtdevolucao != null && ids.Contains(p.CdlocacaoNavigation.CdcaixaMovimento))
            .GroupBy(p => new { p.CdlocacaoNavigation.CdcaixaMovimento, p.CdformaRecebimento })
            .Select(g => new { Caixa = g.Key.CdcaixaMovimento, Forma = g.Key.CdformaRecebimento, Valor = g.Sum(p => p.ValorRecebido) })
            .ToListAsync(ct);

        var sangrias = (await _db.Sangrias
                .Where(s => ids.Contains(s.CdcaixaMovimento))
                .GroupBy(s => s.CdcaixaMovimento)
                .Select(g => new { Caixa = g.Key, Valor = g.Sum(s => s.Valor) })
                .ToListAsync(ct))
            .ToDictionary(x => x.Caixa, x => x.Valor);

        var suprimentos = (await _db.Suprimentos
                .Where(s => ids.Contains(s.CdcaixaMovimento))
                .Select(s => new { s.CdcaixaMovimento, s.Cdusuario, s.Dtsuprimento, s.Valor })
                .ToListAsync(ct))
            .ToLookup(s => s.CdcaixaMovimento);

        var dinheiro = (int)FormaRecebimentoPadrao.Dinheiro;

        foreach (var caixa in caixas)
        {
            locacoes.TryGetValue(caixa.Id, out var loc);
            var vendido = loc?.Vendido ?? 0m;
            var troco = loc?.Troco ?? 0m;
            var gastos = sangrias.GetValueOrDefault(caixa.Id);

            var porForma = parcelas.Where(p => p.Caixa == caixa.Id).ToDictionary(p => p.Forma, p => p.Valor);
            porForma[dinheiro] = porForma.GetValueOrDefault(dinheiro) - troco;

            var suprimentosDoCaixa = suprimentos[caixa.Id].ToList();
            var temLinhaDeAbertura = suprimentosDoCaixa.Any(s =>
                s.Cdusuario == caixa.CdusuarioAbertura
                && s.Valor == caixa.SuprimentoInicial
                && Math.Abs((s.Dtsuprimento - caixa.Dtabertura).TotalSeconds) <= 1);
            var reforcos = suprimentosDoCaixa.Sum(s => s.Valor) - (temLinhaDeAbertura ? caixa.SuprimentoInicial : 0m);

            resultado[caixa.Id] = new ApuracaoCaixa(
                TotalVendido: vendido,
                Troco: troco,
                LocacoesDevolvidas: loc?.Devolvidas ?? 0,
                LocacoesPendentes: loc?.Pendentes ?? 0,
                TotalGastos: gastos,
                Reforcos: reforcos,
                PorForma: porForma,
                SaldoEmDinheiro: caixa.SuprimentoInicial + reforcos + porForma[dinheiro] - gastos,
                SomaFormasDiverge: Math.Abs(porForma.Values.Sum() - vendido) > Tolerancia);
        }

        return resultado;
    }
}
