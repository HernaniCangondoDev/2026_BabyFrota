using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.Domain.Enums;
using BabyFrota.DTOs.Locacoes;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Locacoes;

public class LocacaoService : ILocacaoService
{
    private readonly AppDbContext _db;

    public LocacaoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CarrinhoDisponivelDto>> ListarCarrinhosDisponiveisAsync(CancellationToken ct = default)
    {
        return await _db.Carrinhos
            .Where(c => c.Cdstatus == (int)SituacaoCarrinho.Disponivel)
            .OrderBy(c => c.Descricao)
            .Select(c => new CarrinhoDisponivelDto
            {
                Id = c.Cdcarrinho,
                Descricao = c.Descricao,
                TipoCarrinhoId = c.CdtipoCarrinho,
                TipoCarrinhoDescricao = c.CdtipoCarrinhoNavigation.Descricao,
            })
            .ToListAsync(ct);
    }

    public async Task<List<FaixaPrecoDto>> ListarFaixasPrecoAsync(int carrinhoId, CancellationToken ct = default)
    {
        var carrinho = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == carrinhoId, ct)
            ?? throw new KeyNotFoundException($"Carrinho {carrinhoId} não encontrado.");

        return await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == carrinho.CdtipoCarrinho)
            .OrderBy(p => p.MinimoMinutos)
            .Select(p => new FaixaPrecoDto
            {
                MinimoMinutos = p.MinimoMinutos,
                MaximoMinutos = p.MaximoMinutos,
                Valor = p.Valor,
            })
            .ToListAsync(ct);
    }

    public async Task<List<FormaRecebimentoDto>> ListarFormasRecebimentoAsync(CancellationToken ct = default)
    {
        return await _db.FormaRecebimentos
            .OrderBy(f => f.Nome)
            .Select(f => new FormaRecebimentoDto { Id = f.CdformaRecebimento, Nome = f.Nome })
            .ToListAsync(ct);
    }

    public async Task<List<LocacaoDto>> ListarEmAndamentoAsync(CancellationToken ct = default)
    {
        return await _db.Locacoes
            .Where(l => l.Dtdevolucao == null)
            .OrderByDescending(l => l.Dtentrega)
            .Select(l => new LocacaoDto
            {
                Id = l.Cdlocacao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoId = l.Cdcarrinho,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.ValorTotal,
                Desconto = l.Desconto,
                Troco = l.Troco,
                UsuarioEntregaNome = l.CdusuarioEntregaNavigation.Nome,
                EmAndamento = l.Dtdevolucao == null,
            })
            .ToListAsync(ct);
    }

    public async Task<LocacaoDto> RegistrarEntregaAsync(int usuarioId, EntregaRequest request, CancellationToken ct = default)
    {
        var caixaAberto = await _db.CaixaMovimentos
            .Where(c => c.Dtfechamento == null)
            .OrderByDescending(c => c.Dtabertura)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto — abra o caixa antes de registrar uma entrega.");

        var carrinho = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == request.CarrinhoId, ct)
            ?? throw new KeyNotFoundException($"Carrinho {request.CarrinhoId} não encontrado.");

        if (carrinho.Cdstatus != (int)SituacaoCarrinho.Disponivel)
            throw new InvalidOperationException("Esse carrinho não está disponível para locação.");

        var clienteExiste = await _db.Clientes.AnyAsync(c => c.Cdcliente == request.ClienteId, ct);
        if (!clienteExiste)
            throw new KeyNotFoundException($"Cliente {request.ClienteId} não encontrado.");

        if (request.TempoMinutos <= 0)
            throw new ArgumentException("Informe um tempo de locação válido.");

        var faixa = await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == carrinho.CdtipoCarrinho
                && p.MinimoMinutos <= request.TempoMinutos && p.MaximoMinutos >= request.TempoMinutos)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Não há faixa de preço cadastrada para esse tempo de locação.");

        var desconto = Math.Max(0, request.Desconto);
        var valorTotal = Math.Max(0, faixa.Valor - desconto);

        var somaPagamentos = request.Pagamentos.Sum(p => p.Valor);
        if (request.Pagamentos.Count == 0 || somaPagamentos < valorTotal)
            throw new InvalidOperationException("O valor pago é insuficiente para cobrir o total da locação.");

        var troco = somaPagamentos - valorTotal;

        var locacao = new Locacao
        {
            Cdcliente = request.ClienteId,
            Cdcarrinho = request.CarrinhoId,
            Dtentrega = DateTime.Now,
            CdusuarioEntrega = usuarioId,
            Tempo = request.TempoMinutos,
            Desconto = desconto,
            ValorTotal = valorTotal,
            Troco = troco,
            Observacao = request.Observacao,
            CdcaixaMovimento = caixaAberto.CdcaixaMovimento,
        };

        var numeroParcela = 1;
        foreach (var pagamento in request.Pagamentos)
        {
            locacao.Parcelas.Add(new Parcela
            {
                Nrparcela = numeroParcela++,
                CdformaRecebimento = pagamento.FormaRecebimentoId,
                ValorRecebido = pagamento.Valor,
            });
        }

        carrinho.Cdstatus = (int)SituacaoCarrinho.Alugado;
        carrinho.DataAlteracao = DateTime.Now;

        _db.Locacoes.Add(locacao);
        await _db.SaveChangesAsync(ct);

        return await _db.Locacoes
            .Where(l => l.Cdlocacao == locacao.Cdlocacao)
            .Select(l => new LocacaoDto
            {
                Id = l.Cdlocacao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoId = l.Cdcarrinho,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.ValorTotal,
                Desconto = l.Desconto,
                Troco = l.Troco,
                UsuarioEntregaNome = l.CdusuarioEntregaNavigation.Nome,
                EmAndamento = l.Dtdevolucao == null,
            })
            .FirstAsync(ct);
    }

    public async Task<List<CarrinhoDisponivelDto>> ListarCarrinhosParaTrocaAsync(int locacaoId, CancellationToken ct = default)
    {
        var locacao = await _db.Locacoes
            .Include(l => l.CdcarrinhoNavigation)
            .FirstOrDefaultAsync(l => l.Cdlocacao == locacaoId, ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        if (locacao.Dtdevolucao != null)
            throw new InvalidOperationException("Essa locação já foi devolvida.");

        var tipoCarrinhoAtual = locacao.CdcarrinhoNavigation.CdtipoCarrinho;

        return await _db.Carrinhos
            .Where(c => c.Cdstatus == (int)SituacaoCarrinho.Disponivel && c.CdtipoCarrinho == tipoCarrinhoAtual)
            .OrderBy(c => c.Descricao)
            .Select(c => new CarrinhoDisponivelDto
            {
                Id = c.Cdcarrinho,
                Descricao = c.Descricao,
                TipoCarrinhoId = c.CdtipoCarrinho,
                TipoCarrinhoDescricao = c.CdtipoCarrinhoNavigation.Descricao,
            })
            .ToListAsync(ct);
    }

    public async Task<LocacaoDto> TrocarCarrinhoAsync(int usuarioId, int locacaoId, TrocaCarrinhoRequest request, CancellationToken ct = default)
    {
        var locacao = await _db.Locacoes.FirstOrDefaultAsync(l => l.Cdlocacao == locacaoId, ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        if (locacao.Dtdevolucao != null)
            throw new InvalidOperationException("Essa locação já foi devolvida.");

        var carrinhoAnteriorId = locacao.Cdcarrinho;
        if (request.NovoCarrinhoId == carrinhoAnteriorId)
            throw new InvalidOperationException("Selecione um carrinho diferente do atual.");

        var carrinhoAnterior = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == carrinhoAnteriorId, ct)
            ?? throw new KeyNotFoundException($"Carrinho {carrinhoAnteriorId} não encontrado.");

        var novoCarrinho = await _db.Carrinhos.FirstOrDefaultAsync(c => c.Cdcarrinho == request.NovoCarrinhoId, ct)
            ?? throw new KeyNotFoundException($"Carrinho {request.NovoCarrinhoId} não encontrado.");

        if (novoCarrinho.Cdstatus != (int)SituacaoCarrinho.Disponivel)
            throw new InvalidOperationException("O carrinho selecionado não está disponível para troca.");

        if (novoCarrinho.CdtipoCarrinho != carrinhoAnterior.CdtipoCarrinho)
            throw new InvalidOperationException("O carrinho selecionado deve ser do mesmo tipo do carrinho atual.");

        var tempoDecorrido = Math.Max(0, (int)Math.Round(DateTime.Now.Subtract(locacao.Dtentrega).TotalMinutes));

        var faixaAnterior = await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == carrinhoAnterior.CdtipoCarrinho
                && p.MinimoMinutos <= tempoDecorrido && p.MaximoMinutos >= tempoDecorrido)
            .FirstOrDefaultAsync(ct);

        locacao.Cdcarrinho = request.NovoCarrinhoId;

        carrinhoAnterior.Cdstatus = (int)SituacaoCarrinho.Disponivel;
        carrinhoAnterior.DataAlteracao = DateTime.Now;

        novoCarrinho.Cdstatus = (int)SituacaoCarrinho.Alugado;
        novoCarrinho.DataAlteracao = DateTime.Now;

        _db.Trocas.Add(new Troca
        {
            Cdlocacao = locacaoId,
            CdcarrinhoAnterior = carrinhoAnteriorId,
            CdnovoCarrinho = request.NovoCarrinhoId,
            PrecoCarrinhoAnterior = faixaAnterior?.Valor,
            TempoCarrinhoAnterior = tempoDecorrido,
            Dttroca = DateTime.Now,
            CdusuarioTroca = usuarioId,
        });

        await _db.SaveChangesAsync(ct);

        return await _db.Locacoes
            .Where(l => l.Cdlocacao == locacaoId)
            .Select(l => new LocacaoDto
            {
                Id = l.Cdlocacao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoId = l.Cdcarrinho,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.ValorTotal,
                Desconto = l.Desconto,
                Troco = l.Troco,
                UsuarioEntregaNome = l.CdusuarioEntregaNavigation.Nome,
                EmAndamento = l.Dtdevolucao == null,
            })
            .FirstAsync(ct);
    }

    public async Task<List<TrocaDto>> ListarTrocasAsync(int locacaoId, CancellationToken ct = default)
    {
        return await _db.Trocas
            .Where(t => t.Cdlocacao == locacaoId)
            .OrderByDescending(t => t.Dttroca)
            .Select(t => new TrocaDto
            {
                Id = t.Cdtroca,
                CarrinhoAnteriorId = t.CdcarrinhoAnterior,
                CarrinhoAnteriorDescricao = t.CdcarrinhoAnteriorNavigation.Descricao,
                NovoCarrinhoId = t.CdnovoCarrinho,
                NovoCarrinhoDescricao = t.CdnovoCarrinhoNavigation.Descricao,
                PrecoCarrinhoAnterior = t.PrecoCarrinhoAnterior,
                TempoCarrinhoAnterior = t.TempoCarrinhoAnterior,
                DataTroca = t.Dttroca,
                UsuarioNome = _db.Usuarios.Where(u => u.Cdusuario == t.CdusuarioTroca).Select(u => u.Nome).FirstOrDefault() ?? string.Empty,
            })
            .ToListAsync(ct);
    }

    public async Task<PreviaDevolucaoDto> ObterPreviaDevolucaoAsync(int locacaoId, CancellationToken ct = default)
    {
        var locacao = await _db.Locacoes
            .Include(l => l.CdcarrinhoNavigation)
            .FirstOrDefaultAsync(l => l.Cdlocacao == locacaoId, ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        if (locacao.Dtdevolucao != null)
            throw new InvalidOperationException("Essa locação já foi devolvida.");

        var tempoMinutos = Math.Max(0, (int)Math.Round(DateTime.Now.Subtract(locacao.Dtentrega).TotalMinutes));

        var faixa = await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == locacao.CdcarrinhoNavigation.CdtipoCarrinho
                && p.MinimoMinutos <= tempoMinutos && p.MaximoMinutos >= tempoMinutos)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Não há faixa de preço cadastrada para esse tempo de locação.");

        return new PreviaDevolucaoDto { TempoMinutos = tempoMinutos, Valor = faixa.Valor };
    }

    public async Task<LocacaoDto> RegistrarDevolucaoAsync(int usuarioId, int locacaoId, DevolucaoRequest request, CancellationToken ct = default)
    {
        var locacao = await _db.Locacoes
            .Include(l => l.CdcarrinhoNavigation)
            .Include(l => l.Parcelas)
            .FirstOrDefaultAsync(l => l.Cdlocacao == locacaoId, ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        if (locacao.Dtdevolucao != null)
            throw new InvalidOperationException("Essa locação já foi devolvida.");

        var tempoMinutos = Math.Max(0, (int)Math.Round(DateTime.Now.Subtract(locacao.Dtentrega).TotalMinutes));

        var faixa = await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == locacao.CdcarrinhoNavigation.CdtipoCarrinho
                && p.MinimoMinutos <= tempoMinutos && p.MaximoMinutos >= tempoMinutos)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Não há faixa de preço cadastrada para esse tempo de locação.");

        var desconto = Math.Max(0, request.Desconto);
        var valorTotal = Math.Max(0, faixa.Valor - desconto);

        var somaPagamentos = request.Pagamentos.Sum(p => p.Valor);
        if (request.Pagamentos.Count == 0 || somaPagamentos < valorTotal)
            throw new InvalidOperationException("O valor pago é insuficiente para cobrir o total da devolução.");

        var troco = somaPagamentos - valorTotal;

        locacao.CdusuarioDevolucao = usuarioId;
        locacao.Dtdevolucao = DateTime.Now;
        locacao.Desconto = desconto;
        locacao.Observacao = string.IsNullOrWhiteSpace(request.Observacao)
            ? locacao.Observacao
            : string.IsNullOrWhiteSpace(locacao.Observacao) ? request.Observacao : $"{locacao.Observacao} {request.Observacao}";
        locacao.Tempo = tempoMinutos;
        locacao.Troco = troco;
        locacao.ValorTotal = valorTotal;

        var proximaParcela = (locacao.Parcelas.Count == 0 ? 0 : locacao.Parcelas.Max(p => p.Nrparcela)) + 1;
        foreach (var pagamento in request.Pagamentos)
        {
            locacao.Parcelas.Add(new Parcela
            {
                Nrparcela = proximaParcela++,
                CdformaRecebimento = pagamento.FormaRecebimentoId,
                ValorRecebido = pagamento.Valor,
            });
        }

        locacao.CdcarrinhoNavigation.Cdstatus = (int)SituacaoCarrinho.Disponivel;
        locacao.CdcarrinhoNavigation.DataAlteracao = DateTime.Now;

        await _db.SaveChangesAsync(ct);

        return await _db.Locacoes
            .Where(l => l.Cdlocacao == locacaoId)
            .Select(l => new LocacaoDto
            {
                Id = l.Cdlocacao,
                ClienteId = l.Cdcliente,
                ClienteNome = l.CdclienteNavigation.Nome,
                CarrinhoId = l.Cdcarrinho,
                CarrinhoDescricao = l.CdcarrinhoNavigation.Descricao,
                DataEntrega = l.Dtentrega,
                DataDevolucao = l.Dtdevolucao,
                TempoMinutos = l.Tempo,
                ValorTotal = l.ValorTotal,
                Desconto = l.Desconto,
                Troco = l.Troco,
                UsuarioEntregaNome = l.CdusuarioEntregaNavigation.Nome,
                EmAndamento = l.Dtdevolucao == null,
            })
            .FirstAsync(ct);
    }
}
