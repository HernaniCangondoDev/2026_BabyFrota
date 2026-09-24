using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Caixa;
using BabyFrota.DTOs.Common;
using BabyFrota.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Caixas;

public class FluxoCaixaService : IFluxoCaixaService
{
    /// <summary>Janela padrão quando nenhuma data é informada, para nunca varrer o histórico inteiro de locações.</summary>
    private const int DiasPadraoSemFiltroDeData = 30;

    private readonly AppDbContext _db;
    private readonly ApuradorCaixa _apurador;

    public FluxoCaixaService(AppDbContext db)
    {
        _db = db;
        _apurador = new ApuradorCaixa(db);
    }

    private sealed record LinhaCaixa(
        int Id,
        DateTime Dtabertura,
        DateTime? Dtfechamento,
        decimal SuprimentoInicial,
        int CdusuarioAbertura,
        string AbertoPor,
        string? FechadoPor)
    {
        public CaixaBase ParaBase() => new(Id, Dtabertura, SuprimentoInicial, CdusuarioAbertura);
    }

    private async Task<IQueryable<CaixaMovimento>> ConsultarAsync(int usuarioId, FluxoCaixaFiltro filtro, CancellationToken ct)
    {
        IQueryable<CaixaMovimento> query = _db.CaixaMovimentos;

        // Quem não é supervisão só enxerga os caixas em que participou. O filtro por nome é aplicado por cima disso.
        var supervisor = PerfilUsuarioExtensions.EhSupervisor(await _db.ObterPerfilIdAsync(usuarioId, ct));
        if (!supervisor)
            query = query.Where(c => c.CdusuarioAbertura == usuarioId || c.CdusuarioFechamento == usuarioId);

        if (filtro.DataInicio.HasValue)
        {
            var inicio = filtro.DataInicio.Value.Date;
            query = query.Where(c => c.Dtabertura >= inicio);
        }
        else if (!filtro.DataFim.HasValue)
        {
            var limiteInferiorPadrao = DateTime.Today.AddDays(-DiasPadraoSemFiltroDeData);
            query = query.Where(c => c.Dtabertura >= limiteInferiorPadrao);
        }

        if (filtro.DataFim.HasValue)
        {
            var limite = filtro.DataFim.Value.Date.AddDays(1);
            query = query.Where(c => c.Dtabertura < limite);
        }

        var nome = filtro.UsuarioNome?.Trim();
        if (!string.IsNullOrEmpty(nome))
        {
            query = query.Where(c =>
                c.CdusuarioAberturaNavigation.Nome.Contains(nome)
                || (c.CdusuarioFechamentoNavigation != null && c.CdusuarioFechamentoNavigation.Nome.Contains(nome)));
        }

        return query;
    }

    private static IQueryable<LinhaCaixa> ProjetarLinhas(IQueryable<CaixaMovimento> query)
        => query.Select(c => new LinhaCaixa(
            c.CdcaixaMovimento,
            c.Dtabertura,
            c.Dtfechamento,
            c.SuprimentoInicial,
            c.CdusuarioAbertura,
            c.CdusuarioAberturaNavigation.Nome,
            c.CdusuarioFechamentoNavigation != null ? c.CdusuarioFechamentoNavigation.Nome : null));

    public async Task<PagedResult<FluxoCaixaDto>> ListarAsync(int usuarioId, FluxoCaixaFiltro filtro, CancellationToken ct = default)
    {
        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
        var tamanhoPagina = filtro.TamanhoPagina is < 1 or > 500 ? 10 : filtro.TamanhoPagina;

        var query = await ConsultarAsync(usuarioId, filtro, ct);
        var totalRegistros = await query.CountAsync(ct);

        var linhas = await ProjetarLinhas(query
                .OrderByDescending(c => c.Dtabertura)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina))
            .ToListAsync(ct);

        var apuracoes = await _apurador.ApurarAsync(linhas.Select(l => l.ParaBase()).ToList(), ct);
        var ids = linhas.Select(l => l.Id).ToList();

        var recebidoPorCaixa = (await _db.Locacoes
                .Where(l => l.Dtdevolucao != null && l.CdusuarioDevolucao != null && ids.Contains(l.CdcaixaMovimento))
                .GroupBy(l => new { l.CdcaixaMovimento, l.CdusuarioDevolucao })
                .Select(g => new
                {
                    Caixa = g.Key.CdcaixaMovimento,
                    Usuario = g.Key.CdusuarioDevolucao,
                    Nome = g.Max(l => l.CdusuarioDevolucaoNavigation!.Nome),
                    Total = g.Sum(l => l.ValorTotal ?? 0m),
                    Quantidade = g.Count(),
                })
                .ToListAsync(ct))
            .ToLookup(x => x.Caixa);

        var itens = linhas.Select(l =>
        {
            var a = apuracoes[l.Id];
            return new FluxoCaixaDto
            {
                Id = l.Id,
                UsuarioAberturaNome = l.AbertoPor,
                UsuarioFechamentoNome = l.FechadoPor,
                DataAbertura = l.Dtabertura,
                DataFechamento = l.Dtfechamento,
                Aberto = l.Dtfechamento is null,
                SuprimentoInicial = l.SuprimentoInicial,
                Reforcos = a.Reforcos,
                TotalVendido = a.TotalVendido,
                TotalGastos = a.TotalGastos,
                Troco = a.Troco,
                QuantidadeLocacoes = a.LocacoesDevolvidas,
                LocacoesPendentes = a.LocacoesPendentes,
                PorForma = new Dictionary<int, decimal>(a.PorForma),
                SaldoEmDinheiro = a.SaldoEmDinheiro,
                SomaFormasDiverge = a.SomaFormasDiverge,
                RecebidoPorUsuario = recebidoPorCaixa[l.Id]
                    .OrderByDescending(x => x.Total)
                    .Select(x => new FluxoCaixaRecebidoDto
                    {
                        UsuarioId = x.Usuario ?? 0,
                        UsuarioNome = x.Nome ?? string.Empty,
                        TotalRecebido = x.Total,
                        QuantidadeLocacoes = x.Quantidade,
                    })
                    .ToList(),
            };
        }).ToList();

        return new PagedResult<FluxoCaixaDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = totalRegistros,
        };
    }

    public async Task<FluxoCaixaResumoDto> ObterResumoAsync(int usuarioId, FluxoCaixaFiltro filtro, CancellationToken ct = default)
    {
        var query = await ConsultarAsync(usuarioId, filtro, ct);
        var linhas = await ProjetarLinhas(query).ToListAsync(ct);
        var apuracoes = await _apurador.ApurarAsync(linhas.Select(l => l.ParaBase()).ToList(), ct);
        var ids = linhas.Select(l => l.Id).ToList();

        var totais = new FluxoCaixaTotaisDto
        {
            QuantidadeCaixas = linhas.Count,
            CaixasAbertos = linhas.Count(l => l.Dtfechamento is null),
            CaixasComDivergencia = linhas.Count(l => apuracoes[l.Id].SomaFormasDiverge),
            SuprimentoInicial = linhas.Sum(l => l.SuprimentoInicial),
            Reforcos = linhas.Sum(l => apuracoes[l.Id].Reforcos),
            TotalVendido = linhas.Sum(l => apuracoes[l.Id].TotalVendido),
            TotalGastos = linhas.Sum(l => apuracoes[l.Id].TotalGastos),
            Troco = linhas.Sum(l => apuracoes[l.Id].Troco),
            QuantidadeLocacoes = linhas.Sum(l => apuracoes[l.Id].LocacoesDevolvidas),
            SaldoEmDinheiro = linhas.Sum(l => apuracoes[l.Id].SaldoEmDinheiro),
            PorForma = SomarFormas(linhas.Select(l => apuracoes[l.Id].PorForma)),
        };

        var porDia = linhas
            .GroupBy(l => l.Dtabertura.Date)
            .OrderBy(g => g.Key)
            .Select(g => new FluxoCaixaDiaDto
            {
                Data = g.Key,
                Caixas = g.Count(),
                TotalVendido = g.Sum(l => apuracoes[l.Id].TotalVendido),
                TotalGastos = g.Sum(l => apuracoes[l.Id].TotalGastos),
                PorForma = SomarFormas(g.Select(l => apuracoes[l.Id].PorForma)),
            })
            .ToList();

        var porUtilizador = (await _db.Locacoes
                .Where(l => l.Dtdevolucao != null && l.CdusuarioDevolucao != null && ids.Contains(l.CdcaixaMovimento))
                .GroupBy(l => l.CdusuarioDevolucao)
                .Select(g => new
                {
                    Usuario = g.Key,
                    Nome = g.Max(l => l.CdusuarioDevolucaoNavigation!.Nome),
                    Total = g.Sum(l => l.ValorTotal ?? 0m),
                    Quantidade = g.Count(),
                })
                .ToListAsync(ct))
            .OrderByDescending(x => x.Total)
            .Select(x => new FluxoCaixaRecebidoDto
            {
                UsuarioId = x.Usuario ?? 0,
                UsuarioNome = x.Nome ?? string.Empty,
                TotalRecebido = x.Total,
                QuantidadeLocacoes = x.Quantidade,
            })
            .ToList();

        return new FluxoCaixaResumoDto { Totais = totais, PorDia = porDia, PorUtilizador = porUtilizador };
    }

    private static Dictionary<int, decimal> SomarFormas(IEnumerable<IReadOnlyDictionary<int, decimal>> formas)
    {
        var soma = new Dictionary<int, decimal>();
        foreach (var dicionario in formas)
        {
            foreach (var (forma, valor) in dicionario)
                soma[forma] = soma.GetValueOrDefault(forma) + valor;
        }

        return soma;
    }
}
