using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Common;
using BabyFrota.DTOs.Relatorios;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Relatorios;

public class RelatorioService : IRelatorioService
{
    private readonly AppDbContext _db;

    public RelatorioService(AppDbContext db)
    {
        _db = db;
    }

    // ---------- Relatório de Clientes ----------

    private static IQueryable<Cliente> AplicarFiltroClientes(IQueryable<Cliente> query, RelatorioClientesFiltro filtro)
    {
        if (!string.IsNullOrWhiteSpace(filtro.Nome))
            query = query.Where(c => c.Nome.Contains(filtro.Nome));

        if (!string.IsNullOrWhiteSpace(filtro.Cidade))
            query = query.Where(c => c.Cidade != null && c.Cidade.ToLower() == filtro.Cidade.ToLower());

        if (!string.IsNullOrWhiteSpace(filtro.Uf))
            query = query.Where(c => c.Uf != null && c.Uf.ToLower() == filtro.Uf.ToLower());

        if (filtro.DataCadastroInicio.HasValue)
            query = query.Where(c => c.DataCadastro >= filtro.DataCadastroInicio.Value);

        if (filtro.DataCadastroFinal.HasValue)
        {
            var limite = filtro.DataCadastroFinal.Value.Date.AddDays(1);
            query = query.Where(c => c.DataCadastro < limite);
        }

        if (filtro.DataLocacaoInicio.HasValue || filtro.DataLocacaoFinal.HasValue)
        {
            var inicio = filtro.DataLocacaoInicio;
            var fim = filtro.DataLocacaoFinal.HasValue ? filtro.DataLocacaoFinal.Value.Date.AddDays(1) : (DateTime?)null;
            query = query.Where(c => c.Locacoes.Any(l =>
                (!inicio.HasValue || l.Dtentrega >= inicio.Value) &&
                (!fim.HasValue || l.Dtentrega < fim.Value)));
        }

        return query;
    }

    public async Task<PagedResult<ClienteRelatorioDto>> ListarClientesAsync(RelatorioClientesFiltro filtro, CancellationToken ct = default)
    {
        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
        var tamanhoPagina = filtro.TamanhoPagina is < 1 or > 500 ? 10 : filtro.TamanhoPagina;

        var query = AplicarFiltroClientes(_db.Clientes.AsQueryable(), filtro);
        var totalRegistros = await query.CountAsync(ct);

        // Repetido inline (não extraído para variável de expressão) para o EF Core traduzir em SQL.
        var inicioLoc = filtro.DataLocacaoInicio;
        var fimLocExclusive = filtro.DataLocacaoFinal.HasValue ? filtro.DataLocacaoFinal.Value.Date.AddDays(1) : (DateTime?)null;

        var itens = await query
            .OrderBy(c => c.Nome)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(c => new ClienteRelatorioDto
            {
                Id = c.Cdcliente,
                Nome = c.Nome,
                Cpf = c.Cpf,
                Email = c.Email,
                Cidade = c.Cidade,
                Uf = c.Uf,
                Telefone = !string.IsNullOrEmpty(c.Celular)
                    ? (c.Dddcelular ?? "") + " " + c.Celular
                    : c.Dddtelefone + " " + c.Telefone,
                DataCadastro = c.DataCadastro,
                QuantidadeLocacoes = c.Locacoes.Count(l =>
                    (!inicioLoc.HasValue || l.Dtentrega >= inicioLoc.Value) &&
                    (!fimLocExclusive.HasValue || l.Dtentrega < fimLocExclusive.Value)),
                TempoTotalMinutos = c.Locacoes.Where(l =>
                        (!inicioLoc.HasValue || l.Dtentrega >= inicioLoc.Value) &&
                        (!fimLocExclusive.HasValue || l.Dtentrega < fimLocExclusive.Value))
                    .Sum(l => (int?)l.Tempo) ?? 0,
                TotalGasto = c.Locacoes.Where(l =>
                        (!inicioLoc.HasValue || l.Dtentrega >= inicioLoc.Value) &&
                        (!fimLocExclusive.HasValue || l.Dtentrega < fimLocExclusive.Value))
                    .Sum(l => (decimal?)l.ValorTotal) ?? 0,
                DataUltimaLocacao = c.Locacoes
                    .OrderByDescending(l => l.Dtentrega)
                    .Select(l => (DateTime?)l.Dtentrega)
                    .FirstOrDefault(),
                PrimeiroTipoCarrinho = c.Locacoes
                    .OrderBy(l => l.Dtentrega)
                    .Select(l => l.CdcarrinhoNavigation.CdtipoCarrinhoNavigation.Descricao)
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        return new PagedResult<ClienteRelatorioDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = totalRegistros,
        };
    }

    public async Task<RelatorioClientesResumoDto> ObterResumoClientesAsync(RelatorioClientesFiltro filtro, CancellationToken ct = default)
    {
        var query = AplicarFiltroClientes(_db.Clientes.AsQueryable(), filtro);

        var inicioLoc = filtro.DataLocacaoInicio;
        var fimLocExclusive = filtro.DataLocacaoFinal.HasValue ? filtro.DataLocacaoFinal.Value.Date.AddDays(1) : (DateTime?)null;

        var totalClientes = await query.CountAsync(ct);

        var locacoesFiltradas = query.SelectMany(c => c.Locacoes.Where(l =>
            (!inicioLoc.HasValue || l.Dtentrega >= inicioLoc.Value) &&
            (!fimLocExclusive.HasValue || l.Dtentrega < fimLocExclusive.Value)));

        var totalLocacoes = await locacoesFiltradas.CountAsync(ct);
        var totalGasto = await locacoesFiltradas.SumAsync(l => (decimal?)l.ValorTotal, ct) ?? 0;

        return new RelatorioClientesResumoDto
        {
            TotalClientes = totalClientes,
            TotalLocacoes = totalLocacoes,
            TotalGasto = totalGasto,
            TicketMedioPorCliente = totalClientes == 0 ? 0 : totalGasto / totalClientes,
        };
    }

    // ---------- Histórico de Locações ----------

    /// <summary>Janela padrão aplicada quando nenhuma data é informada, para nunca variar sobre a tabela inteira.</summary>
    private const int DiasPadraoSemFiltroDeData = 90;

    private static IQueryable<Locacao> AplicarFiltroHistorico(IQueryable<Locacao> query, RelatorioHistoricoFiltro filtro)
    {
        if (filtro.DataEntregaInicio.HasValue)
        {
            query = query.Where(l => l.Dtentrega >= filtro.DataEntregaInicio.Value);
        }
        else if (!filtro.DataEntregaFinal.HasValue)
        {
            // Nenhuma data informada: evita full-scan/aggregate sobre a tabela inteira de Locação
            // (pode ter centenas de milhares de linhas em produção) limitando aos últimos 90 dias por padrão.
            var limiteInferiorPadrao = DateTime.Now.AddDays(-DiasPadraoSemFiltroDeData);
            query = query.Where(l => l.Dtentrega >= limiteInferiorPadrao);
        }

        if (filtro.DataEntregaFinal.HasValue)
        {
            var limite = filtro.DataEntregaFinal.Value.Date.AddDays(1);
            query = query.Where(l => l.Dtentrega < limite);
        }

        if (!string.IsNullOrWhiteSpace(filtro.ClienteNome))
            query = query.Where(l => l.CdclienteNavigation.Nome.Contains(filtro.ClienteNome));

        if (filtro.CarrinhoId.HasValue)
            query = query.Where(l => l.Cdcarrinho == filtro.CarrinhoId.Value);
        else if (filtro.TipoCarrinhoId.HasValue) // carrinho específico tem prioridade sobre tipo, igual ao legado
            query = query.Where(l => l.CdcarrinhoNavigation.CdtipoCarrinho == filtro.TipoCarrinhoId.Value);

        if (filtro.SomenteEmAndamento == true)
            query = query.Where(l => l.Dtdevolucao == null);

        return query;
    }

    public async Task<PagedResult<LocacaoHistoricoDto>> ListarHistoricoAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default)
    {
        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
        var tamanhoPagina = filtro.TamanhoPagina is < 1 or > 500 ? 10 : filtro.TamanhoPagina;

        var query = AplicarFiltroHistorico(_db.Locacoes.AsQueryable(), filtro);
        var totalRegistros = await query.CountAsync(ct);

        var itens = await query
            .OrderByDescending(l => l.Dtentrega)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(l => new LocacaoHistoricoDto
            {
                Id = l.Cdlocacao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoId = l.Cdcarrinho,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                TipoCarrinhoDescricao = l.CdcarrinhoNavigation.CdtipoCarrinhoNavigation.Descricao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.ValorTotal,
                Desconto = l.Desconto,
                Troco = l.Troco,
                FormaPagamento = l.Parcelas
                    .OrderBy(p => p.Nrparcela)
                    .Select(p => p.CdformaRecebimentoNavigation.Nome)
                    .FirstOrDefault() ?? "-",
                QuantidadeParcelas = l.Parcelas.Count(),
                UsuarioEntregaNome = l.CdusuarioEntregaNavigation.Nome,
                UsuarioDevolucaoNome = l.CdusuarioDevolucaoNavigation != null ? l.CdusuarioDevolucaoNavigation.Nome : null,
                EmAndamento = l.Dtdevolucao == null,
            })
            .ToListAsync(ct);

        return new PagedResult<LocacaoHistoricoDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = totalRegistros,
        };
    }

    public async Task<RelatorioHistoricoResumoDto> ObterResumoHistoricoAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default)
    {
        var query = AplicarFiltroHistorico(_db.Locacoes.AsQueryable(), filtro);

        var totalLocacoes = await query.CountAsync(ct);
        var faturamento = await query.SumAsync(l => (decimal?)l.ValorTotal, ct) ?? 0;
        var tempoMedio = totalLocacoes == 0
            ? 0
            : await query.Where(l => l.Tempo != null).AverageAsync(l => (double?)l.Tempo, ct) ?? 0;

        return new RelatorioHistoricoResumoDto
        {
            TotalLocacoes = totalLocacoes,
            Faturamento = faturamento,
            TicketMedio = totalLocacoes == 0 ? 0 : faturamento / totalLocacoes,
            TempoMedioMinutos = tempoMedio,
        };
    }

    public async Task<List<FaturamentoPorDiaDto>> ObterFaturamentoPorDiaAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default)
    {
        var query = AplicarFiltroHistorico(_db.Locacoes.AsQueryable(), filtro);

        return await query
            .GroupBy(l => l.Dtentrega.Date)
            .Select(g => new FaturamentoPorDiaDto
            {
                Data = g.Key,
                Quantidade = g.Count(),
                Faturamento = g.Sum(l => (decimal?)l.ValorTotal) ?? 0,
            })
            .OrderBy(d => d.Data)
            .ToListAsync(ct);
    }
}
