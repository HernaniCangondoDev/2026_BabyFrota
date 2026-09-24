using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.Domain.Enums;
using BabyFrota.DTOs.Locacoes;
using BabyFrota.Services.Common;
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

        // Igual ao legado: a entrega não calcula preço nem recebe pagamento — ninguém sabe ainda por quanto tempo
        // o carrinho será usado. Tempo, valor, desconto, troco e parcelas são gravados só na devolução.
        var locacao = new Locacao
        {
            Cdcliente = request.ClienteId,
            Cdcarrinho = request.CarrinhoId,
            Dtentrega = DateTime.Now,
            CdusuarioEntrega = usuarioId,
            Observacao = request.Observacao,
            CdcaixaMovimento = caixaAberto.CdcaixaMovimento,
        };

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

        var (faixaAnterior, _) = await ObterFaixaAsync(carrinhoAnterior.CdtipoCarrinho, tempoDecorrido, ct);

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

        var (faixa, acimaDaTabela) = await ObterFaixaAsync(locacao.CdcarrinhoNavigation.CdtipoCarrinho, tempoMinutos, ct);
        if (faixa is null)
            throw new InvalidOperationException(MensagemSemFaixa(tempoMinutos));

        return new PreviaDevolucaoDto
        {
            TempoMinutos = tempoMinutos,
            Valor = faixa.Valor,
            AcimaDaTabela = acimaDaTabela,
            MaximoTabelaMinutos = acimaDaTabela ? faixa.MaximoMinutos : null,
            ValorJaRecebido = await _db.Parcelas.Where(p => p.Cdlocacao == locacaoId).SumAsync(p => p.ValorRecebido, ct),
        };
    }

    /// <summary>
    /// Faixa de preço do tipo de carrinho para o tempo decorrido. Acima da última faixa cadastrada vale o preço dela
    /// (<c>AcimaDaTabela = true</c>): o legado lançava erro nesse caso, o que travava a devolução e, com ela, o fechamento
    /// do caixa. Lacuna entre faixas continua sem resultado, porque é erro de cadastro e não há valor certo a cobrar.
    /// </summary>
    private async Task<(PrecoLocacao? Faixa, bool AcimaDaTabela)> ObterFaixaAsync(int tipoCarrinhoId, int tempoMinutos, CancellationToken ct)
    {
        var faixas = await _db.PrecoLocacoes
            .Where(p => p.CdtipoCarrinho == tipoCarrinhoId)
            .ToListAsync(ct);

        var faixa = faixas.FirstOrDefault(p => p.MinimoMinutos <= tempoMinutos && p.MaximoMinutos >= tempoMinutos);
        if (faixa is not null)
            return (faixa, false);

        var ultima = faixas.OrderByDescending(p => p.MaximoMinutos).FirstOrDefault();
        return ultima is not null && tempoMinutos > ultima.MaximoMinutos ? (ultima, true) : (null, false);
    }

    private static string MensagemSemFaixa(int tempoMinutos)
        => $"Não há faixa de preço cadastrada para {tempoMinutos} minutos nesse tipo de carrinho.";

    /// <summary>Duas casas, como as colunas decimal(12,2): assim "recebido − troco = total" fecha ao centavo.</summary>
    private static decimal Arredondar(decimal valor) => decimal.Round(valor, 2, MidpointRounding.AwayFromZero);

    /// <summary>Cada pagamento precisa ter valor positivo e uma forma de recebimento que exista.</summary>
    private async Task ValidarPagamentosAsync(IReadOnlyCollection<PagamentoRequest> pagamentos, CancellationToken ct)
    {
        if (pagamentos.Any(p => p.Valor <= 0))
            throw new InvalidOperationException("Cada forma de pagamento precisa ter um valor maior que zero.");

        var formas = pagamentos.Select(p => p.FormaRecebimentoId).Distinct().ToList();
        if (formas.Count > 0 && await _db.FormaRecebimentos.CountAsync(f => formas.Contains(f.CdformaRecebimento), ct) != formas.Count)
            throw new InvalidOperationException("Forma de recebimento inválida.");
    }

    /// <summary>Formata em reais sem depender da cultura do servidor (containers costumam rodar com cultura invariante).</summary>
    private static string Moeda(decimal valor)
        => "R$ " + valor.ToString("N2", System.Globalization.CultureInfo.InvariantCulture)
            .Replace(",", "#").Replace(".", ",").Replace("#", ".");

    public async Task<LocacaoDto> RegistrarDevolucaoAsync(int usuarioId, int locacaoId, DevolucaoRequest request, CancellationToken ct = default)
    {
        var locacao = await _db.Locacoes
            .Include(l => l.CdcarrinhoNavigation)
            .Include(l => l.Parcelas)
            .FirstOrDefaultAsync(l => l.Cdlocacao == locacaoId, ct)
            ?? throw new KeyNotFoundException($"Locação {locacaoId} não encontrada.");

        if (locacao.Dtdevolucao != null)
            throw new InvalidOperationException("Essa locação já foi devolvida.");

        // A devolução é o único ponto em que entra dinheiro, então precisa de um caixa aberto para recebê-lo.
        var caixaAberto = await _db.CaixaMovimentos
            .Where(c => c.Dtfechamento == null)
            .OrderByDescending(c => c.Dtabertura)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Não há caixa aberto — abra o caixa antes de registrar uma devolução.");

        var desconto = Arredondar(Math.Max(0, request.Desconto));
        if (desconto > 0)
        {
            // Igual ao legado (DevolucaoCarrinho.aspx.cs): só Administrador concede desconto.
            if (!PerfilUsuarioExtensions.EhAdministrador(await _db.ObterPerfilIdAsync(usuarioId, ct)))
                throw new AcessoNegadoException("Somente o perfil Administrador pode conceder desconto.");
        }

        var tempoMinutos = Math.Max(0, (int)Math.Round(DateTime.Now.Subtract(locacao.Dtentrega).TotalMinutes));

        var (faixa, acimaDaTabela) = await ObterFaixaAsync(locacao.CdcarrinhoNavigation.CdtipoCarrinho, tempoMinutos, ct);
        if (faixa is null)
            throw new InvalidOperationException(MensagemSemFaixa(tempoMinutos));

        var valorTotal = Math.Max(0, faixa.Valor - desconto);

        // Parcelas que a locação já tem. No fluxo atual a entrega não cobra, então só existem em locações entregues no
        // fluxo antigo (a entrega também recebia). Entram na conta para que "recebido − troco = total" valha sempre.
        var jaRecebido = locacao.Parcelas.Sum(p => p.ValorRecebido);

        // Sem nada a cobrar (desconto total, faixa gratuita) a devolução não exige pagamento, e qualquer pagamento
        // enviado junto é ignorado: nada é recebido agora.
        var pagamentos = valorTotal > 0
            ? request.Pagamentos.Select(p => new PagamentoRequest { FormaRecebimentoId = p.FormaRecebimentoId, Valor = Arredondar(p.Valor) }).ToList()
            : [];
        await ValidarPagamentosAsync(pagamentos, ct);

        var totalRecebido = jaRecebido + pagamentos.Sum(p => p.Valor);
        if (totalRecebido < valorTotal)
            throw new InvalidOperationException(jaRecebido > 0
                ? $"O valor recebido ({Moeda(totalRecebido)}, contando {Moeda(jaRecebido)} já recebidos antes) é insuficiente para cobrir o total da devolução ({Moeda(valorTotal)})."
                : $"O valor pago ({Moeda(totalRecebido)}) é insuficiente para cobrir o total da devolução ({Moeda(valorTotal)}).");

        // Nunca aceita menos que o total; se veio mais, a diferença volta sempre ao cliente como troco.
        var troco = totalRecebido - valorTotal;

        // O valor entra no caixa aberto agora. Na prática é o mesmo da entrega (o fechamento é bloqueado com
        // devoluções pendentes), mas cobre locações antigas que ficaram abertas por um caixa já fechado.
        locacao.CdcaixaMovimento = caixaAberto.CdcaixaMovimento;
        locacao.CdusuarioDevolucao = usuarioId;
        locacao.Dtdevolucao = DateTime.Now;
        locacao.Desconto = desconto;
        locacao.Observacao = string.IsNullOrWhiteSpace(request.Observacao)
            ? locacao.Observacao
            : string.IsNullOrWhiteSpace(locacao.Observacao) ? request.Observacao : $"{locacao.Observacao} {request.Observacao}";
        if (acimaDaTabela)
        {
            // Não há auditoria de alterações no sistema novo: deixa registrado que o valor veio do teto da tabela.
            const string aviso = "[Tempo acima da tabela: cobrada a última faixa]";
            locacao.Observacao = string.IsNullOrWhiteSpace(locacao.Observacao) ? aviso : $"{locacao.Observacao} {aviso}";
        }
        // Locacao.Observacao é varchar(500): estourar o limite viraria erro 500 na hora de gravar a devolução.
        if (locacao.Observacao is { Length: > 500 })
            locacao.Observacao = locacao.Observacao[..500];
        locacao.Tempo = tempoMinutos;
        locacao.Troco = troco;
        locacao.ValorTotal = valorTotal;

        var proximaParcela = (locacao.Parcelas.Count == 0 ? 0 : locacao.Parcelas.Max(p => p.Nrparcela)) + 1;
        foreach (var pagamento in pagamentos)
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
