using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Common;
using BabyFrota.DTOs.Locacoes;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Locacoes;

public class LocacaoConsultaService : ILocacaoConsultaService
{
    /// <summary>Janela padrão quando nenhuma data é informada, para nunca varrer a tabela inteira (centenas de milhares de linhas).</summary>
    private const int DiasPadraoSemFiltroDeData = 90;

    private const decimal Tolerancia = 0.005m;

    private readonly AppDbContext _db;
    private readonly ILocacaoService _locacoes;

    public LocacaoConsultaService(AppDbContext db, ILocacaoService locacoes)
    {
        _db = db;
        _locacoes = locacoes;
    }

    private static IQueryable<Locacao> AplicarFiltro(IQueryable<Locacao> query, LocacaoConsultaFiltro filtro)
    {
        if (filtro.Estado == EstadoLocacaoFiltro.Entregue)
            query = query.Where(l => l.Dtdevolucao == null);
        else if (filtro.Estado == EstadoLocacaoFiltro.Devolvido)
            query = query.Where(l => l.Dtdevolucao != null);

        if (filtro.DataEntregaInicio.HasValue)
        {
            var inicio = filtro.DataEntregaInicio.Value.Date;
            query = query.Where(l => l.Dtentrega >= inicio);
        }
        else if (!filtro.DataEntregaFim.HasValue && filtro.Estado != EstadoLocacaoFiltro.Entregue)
        {
            // Sem data, olha só os últimos 90 dias. A exceção é "Entregue": são as locações ainda abertas, poucas, e
            // justamente as antigas e esquecidas são as que interessa achar (o índice das abertas as encontra rápido).
            var limiteInferiorPadrao = DateTime.Now.AddDays(-DiasPadraoSemFiltroDeData);
            query = query.Where(l => l.Dtentrega >= limiteInferiorPadrao);
        }

        if (filtro.DataEntregaFim.HasValue)
        {
            var limite = filtro.DataEntregaFim.Value.Date.AddDays(1);
            query = query.Where(l => l.Dtentrega < limite);
        }

        var nome = filtro.ClienteNome?.Trim();
        if (!string.IsNullOrEmpty(nome))
            query = query.Where(l => l.CdclienteNavigation.Nome.Contains(nome));

        if (filtro.CarrinhoId.HasValue)
            query = query.Where(l => l.Cdcarrinho == filtro.CarrinhoId.Value);
        else if (filtro.TipoCarrinhoId.HasValue) // carrinho específico tem prioridade sobre o tipo, como no histórico
            query = query.Where(l => l.CdcarrinhoNavigation.CdtipoCarrinho == filtro.TipoCarrinhoId.Value);

        if (filtro.FormaRecebimentoId.HasValue)
            query = query.Where(l => l.Parcelas.Any(p => p.CdformaRecebimento == filtro.FormaRecebimentoId.Value));

        return query;
    }

    public async Task<PagedResult<LocacaoConsultaDto>> ConsultarAsync(LocacaoConsultaFiltro filtro, CancellationToken ct = default)
    {
        var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
        var tamanhoPagina = filtro.TamanhoPagina is < 1 or > 500 ? 10 : filtro.TamanhoPagina;

        var query = AplicarFiltro(_db.Locacoes.AsQueryable(), filtro);
        var totalRegistros = await query.CountAsync(ct);

        var itens = await query
            .OrderByDescending(l => l.Dtentrega)
            .ThenByDescending(l => l.Cdlocacao)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(l => new LocacaoConsultaDto
            {
                Id = l.Cdlocacao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                TipoCarrinhoDescricao = l.CdcarrinhoNavigation.CdtipoCarrinhoNavigation.Descricao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.Dtdevolucao != null ? l.ValorTotal : null,
                Entregue = l.Dtdevolucao == null,
            })
            .ToListAsync(ct);

        return new PagedResult<LocacaoConsultaDto>
        {
            Itens = itens,
            Pagina = pagina,
            TamanhoPagina = tamanhoPagina,
            TotalRegistros = totalRegistros,
        };
    }

    public async Task<LocacaoConsultaResumoDto> ObterResumoAsync(LocacaoConsultaFiltro filtro, CancellationToken ct = default)
    {
        var query = AplicarFiltro(_db.Locacoes.AsQueryable(), filtro);

        var totais = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Entregues = g.Count(l => l.Dtdevolucao == null),
                Valor = g.Sum(l => l.Dtdevolucao != null ? (l.ValorTotal ?? 0m) : 0m),
            })
            .FirstOrDefaultAsync(ct);

        return new LocacaoConsultaResumoDto
        {
            TotalLocacoes = totais?.Total ?? 0,
            TotalEntregues = totais?.Entregues ?? 0,
            TotalDevolvidas = (totais?.Total ?? 0) - (totais?.Entregues ?? 0),
            ValorTotal = totais?.Valor ?? 0m,
        };
    }

    public async Task<LocacaoDetalheDto> ObterDetalheAsync(int locacaoId, CancellationToken ct = default)
    {
        var l = await _db.Locacoes
            .Where(x => x.Cdlocacao == locacaoId)
            .Select(x => new
            {
                x.Cdlocacao,
                x.Cdcliente,
                ClienteNome = x.CdclienteNavigation.Nome,
                DddTelefone = x.CdclienteNavigation.Dddtelefone,
                Telefone = x.CdclienteNavigation.Telefone,
                DddCelular = x.CdclienteNavigation.Dddcelular,
                Celular = x.CdclienteNavigation.Celular,
                x.Cdcarrinho,
                CarrinhoDescricao = x.CdcarrinhoNavigation.Descricao,
                Tipo = x.CdcarrinhoNavigation.CdtipoCarrinhoNavigation.Descricao,
                x.Dtentrega,
                x.Dtdevolucao,
                UsuarioEntrega = x.CdusuarioEntregaNavigation.Nome,
                UsuarioDevolucao = x.CdusuarioDevolucaoNavigation != null ? x.CdusuarioDevolucaoNavigation.Nome : null,
                x.Tempo,
                x.Desconto,
                x.ValorTotal,
                x.Troco,
                x.Observacao,
                x.CdcaixaMovimento,
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        var pagamentos = await _db.Parcelas
            .Where(p => p.Cdlocacao == locacaoId)
            .OrderBy(p => p.Nrparcela)
            .Select(p => new LocacaoPagamentoDto
            {
                Numero = p.Nrparcela,
                FormaRecebimentoId = p.CdformaRecebimento,
                FormaRecebimentoNome = p.CdformaRecebimentoNavigation.Nome,
                ValorRecebido = p.ValorRecebido,
            })
            .ToListAsync(ct);

        var recebido = pagamentos.Sum(p => p.ValorRecebido);
        var devolvida = l.Dtdevolucao is not null;

        // Devolvida: recebido − troco tem de dar o valor total. Não devolvida: não deveria haver pagamento algum.
        var inconsistente = devolvida
            ? Math.Abs(recebido - (l.Troco ?? 0m) - (l.ValorTotal ?? 0m)) > Tolerancia
            : pagamentos.Count > 0;

        return new LocacaoDetalheDto
        {
            Id = l.Cdlocacao,
            Entregue = !devolvida,
            ClienteId = l.Cdcliente,
            ClienteNome = l.ClienteNome,
            ClienteDddTelefone = l.DddTelefone,
            ClienteTelefone = l.Telefone,
            ClienteDddCelular = l.DddCelular,
            ClienteCelular = l.Celular,
            CarrinhoId = l.Cdcarrinho,
            CarrinhoDescricao = l.CarrinhoDescricao,
            TipoCarrinhoDescricao = l.Tipo,
            DataEntrega = l.Dtentrega,
            DataDevolucao = l.Dtdevolucao,
            UsuarioEntregaNome = l.UsuarioEntrega,
            UsuarioDevolucaoNome = l.UsuarioDevolucao,
            TempoMinutos = l.Tempo,
            ValorTabela = devolvida && l.ValorTotal is not null ? l.ValorTotal + (l.Desconto ?? 0m) : null,
            Desconto = l.Desconto,
            ValorTotal = devolvida ? l.ValorTotal : null,
            Troco = l.Troco,
            ValorRecebido = recebido,
            Observacao = l.Observacao,
            CaixaId = l.CdcaixaMovimento,
            PagamentosInconsistentes = inconsistente,
            Pagamentos = pagamentos,
            Trocas = await _locacoes.ListarTrocasAsync(locacaoId, ct),
        };
    }
}
